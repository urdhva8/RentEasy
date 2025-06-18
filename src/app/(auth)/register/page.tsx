
import { RegisterForm } from "@/components/auth/register-form";
import { Home } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 text-primary-foreground mb-8">
            <Home className="h-12 w-12" />
            <h1 className="text-5xl font-headline font-bold">RentEasy</h1>
        </div>
      <RegisterForm />
    </div>
  );
}
