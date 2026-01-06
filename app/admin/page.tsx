// app/admin/page.tsx
import Display from "@/components/pages/admin/display/Display";

// This is the main entry point for the Admin Panel
export default function AdminPage() {
    return (
        // The Display component handles the full layout (sidebar + content)
        <Display />
    );
}