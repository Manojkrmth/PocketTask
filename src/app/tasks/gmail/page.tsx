// This file is now the pre-task screen, handled by /tasks/[taskType]/page.tsx.
// The actual task screen is at /tasks/gmail/play/page.tsx.
// The redirect is no longer needed here as the link in /tasks/page.tsx points to the correct dynamic route.
export default function GmailRedirectPage() {
    // This component is effectively unused due to routing changes,
    // but we'll keep it to avoid breaking imports if any exist.
    // The logic is now handled by the dynamic route at /app/tasks/[taskType]/page.tsx.
    return null;
}
