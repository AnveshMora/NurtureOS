import { useChildStore } from '../store';
import type { ChildProfile } from '../types';

export function useActiveChild(): {
  child: ChildProfile | null;
  children: ChildProfile[];
  activeChildId: string | null;
  setActiveChild: (id: string) => void;
  hasChildren: boolean;
} {
  const children = useChildStore((s) => s.children);
  const activeChildId = useChildStore((s) => s.activeChildId);
  const setActiveChild = useChildStore((s) => s.setActiveChild);

  const child = children.find((c) => c.id === activeChildId) ?? null;

  return {
    child,
    children,
    activeChildId,
    setActiveChild,
    hasChildren: children.length > 0,
  };
}
