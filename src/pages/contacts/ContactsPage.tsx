import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { contactsApi, type ContactInfo, type ContactsResponse } from '../../api/contacts';
import { UserRole } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { PageContent } from '../../components/layout/PageContent';
import { Card, Avatar, Badge, EmptyState } from '../../components/ui';

export function ContactsPage() {
  const { user } = useAuth();
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

  const NoContactsIcon = () => (
    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle="Staff and administration directory"
      />

      <PageContent>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Coaches Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Coaches</h2>
                {canFilterMyCoaches && contacts && contacts.myCoachIds.length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnlyMyCoaches}
                      onChange={(e) => setShowOnlyMyCoaches(e.target.checked)}
                      className="w-4 h-4 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 dark:bg-gray-800"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Only my coaches</span>
                  </label>
                )}
              </div>

              {filteredCoaches.length === 0 ? (
                <EmptyState
                  icon={<NoContactsIcon />}
                  title="No coaches found"
                  description={showOnlyMyCoaches ? "You don't have any assigned coaches. Try turning off the filter." : "No coaches are available at the moment."}
                />
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
            </Card>

            {/* Admins Section */}
            {contacts && contacts.admins.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Administration
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contacts.admins.map((admin) => (
                    <ContactCard key={admin.id} contact={admin} />
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </PageContent>
    </>
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
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-start gap-4">
        <Avatar
          firstName={contact.firstName}
          lastName={contact.lastName}
          size="lg"
          className="bg-gradient-to-br from-green-400 to-emerald-500"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {contact.firstName} {contact.lastName}
            </h3>
            {isMyCoach && (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                My coach
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {contact.role === 'COACH' ? 'Coach' : 'Administrator'}
          </p>

          <div className="mt-3 space-y-1">
            <button
              onClick={() => copyToClipboard(contact.email, 'email')}
              className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 truncate w-full text-left group cursor-pointer"
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
                <span className="text-xs text-green-600 dark:text-green-400 flex-shrink-0">Copied!</span>
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
                className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 w-full text-left group cursor-pointer"
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
                  <span className="text-xs text-green-600 dark:text-green-400 flex-shrink-0">Copied!</span>
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
                  className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
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
