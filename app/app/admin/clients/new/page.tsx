import { CreateClientForm } from "../create-client-form";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Add Client</h1>
      <CreateClientForm />
    </div>
  );
}
