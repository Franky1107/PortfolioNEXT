import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/blog/auth";
import { db } from "@/lib/blog/data";
import Editor from "../../Editor";

export default function EditPost({ params }: PageProps<"/admin/edit/[id]">) {
  return (
    <Suspense fallback={null}>
      <Load params={params} />
    </Suspense>
  );
}

async function Load({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const post = await db()?.get(Number((await params).id));
  if (!post) notFound();
  return <Editor post={post} />;
}
