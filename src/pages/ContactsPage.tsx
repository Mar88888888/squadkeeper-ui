import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { contactsApi, type ContactInfo, type ContactsResponse } from '../api/contacts';
import { UserRole } from '../types';

export function ContactsPage() {
  const { user, logout } = useAuth();
  const [contacts, setContacts] = useState<ContactsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyMyCoaches, setShowOnlyMyCoaches] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await contactsApi.getContacts();
      setContacts(data);
    } catch {
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const filteredCoaches = useMemo(() => {
    if (!contacts) return [];
    if (!showOnlyMyCoaches) return contacts.coaches;
    return contacts.coaches.filter((coach) =>
      contacts.myCoachIds.includes(coach.id)
    );
  }, [contacts, showOnlyMyCoaches]);

  const canFilterMyCoaches =
    user?.role === UserRole.PLAYER || user?.role === UserRole.PARENT;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <span className="font-bold text-xl text-gray-900">Football Academy</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-500">
            Loading contacts...
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-red-600">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Coaches Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Coaches</h2>
                {canFilterMyCoaches && contacts && contacts.myCoachIds.length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnlyMyCoaches}
                      onChange={(e) => setShowOnlyMyCoaches(e.target.checked)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Only my coaches</span>
                  </label>
                )}
              </div>

              {filteredCoaches.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No coaches found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCoaches.map((coach) => (
                    <ContactCard
                      key={coach.id}
                      contact={coach}
                      isMyCoach={contacts?.myCoachIds.includes(coach.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Admins Section */}
            {contacts && contacts.admins.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Administration
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contacts.admins.map((admin) => (
                    <ContactCard key={admin.id} contact={admin} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ContactCard({
  contact,
  isMyCoach,
}: {
  contact: ContactInfo;
  isMyCoach?: boolean;
}) {
  const [copiedField, setCopiedField] = useState<'email' | 'phone' | null>(null);

  const copyToClipboard = useCallback(async (text: string, field: 'email' | 'phone') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, []);

  return (
    <div className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 select-none">
          <span className="text-lg font-semibold text-blue-600">
            {contact.firstName[0]}
            {contact.lastName[0]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">
              {contact.firstName} {contact.lastName}
            </h3>
            {isMyCoach && (
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                My coach
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {contact.role === 'COACH' ? 'Coach' : 'Administrator'}
          </p>

          <div className="mt-3 space-y-1">
            <button
              onClick={() => copyToClipboard(contact.email, 'email')}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 truncate w-full text-left group cursor-pointer"
              title="Click to copy"
            >
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="truncate">{contact.email}</span>
              {copiedField === 'email' ? (
                <span className="text-xs text-green-600 flex-shrink-0">Copied!</span>
              ) : (
                <svg
                  className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
            {contact.phoneNumber && (
              <button
                onClick={() => copyToClipboard(contact.phoneNumber!, 'phone')}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 w-full text-left group cursor-pointer"
                title="Click to copy"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>{contact.phoneNumber}</span>
                {copiedField === 'phone' ? (
                  <span className="text-xs text-green-600 flex-shrink-0">Copied!</span>
                ) : (
                  <svg
                    className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>

          {contact.groups && contact.groups.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {contact.groups.map((group) => (
                <span
                  key={group.id}
                  className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded"
                >
                  {group.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
