import { Suspense } from "react";
import { requireAdmin } from "@/lib/blog/auth";
import Editor from "../Editor";

export default function NewPost() {
  return (
    <Suspense fallback={null}>
      <Guarded />
    </Suspense>
  );
}

async function Guarded() {
  await requireAdmin();
  return <Editor />;
}
