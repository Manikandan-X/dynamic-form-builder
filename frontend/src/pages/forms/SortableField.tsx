import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Box from "@mui/material/Box";

export function SortableField({
  id,
  children,
}: {
  id: string;
  children: (dragHandleProps: { attributes: Record<string, unknown>; listeners: Record<string, unknown> }) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style}>
      {children({ attributes: attributes as unknown as Record<string, unknown>, listeners: listeners as unknown as Record<string, unknown> })}
    </Box>
  );
}
