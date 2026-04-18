import { createFileRoute } from "@tanstack/react-router";
import { MemoireApp } from "@/components/memoire/MemoireApp";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <MemoireApp />;
}
