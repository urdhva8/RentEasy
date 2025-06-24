
import { EditProfileForm } from "@/components/profile/edit-profile-form";

export const dynamic = 'force-dynamic';

export default function EditProfilePage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <EditProfileForm />
    </div>
  );
}
