"use client";

import { Dispatch, SetStateAction } from "react";

interface SidePanelProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  active: string;
  setActive: Dispatch<SetStateAction<string>>;
  items: { id: string; label: string }[];
  isMobile: boolean;
}

export default function SidePanel({
  open,
  setOpen,
  active,
  setActive,
  items,
  isMobile,
}: SidePanelProps) {
  return (
    <>
      {/* Sidebar */}
      <aside
        className={`bg-white/20 backdrop-blur-md border-r border-white/30 flex flex-col p-4 rounded-2xl transition-all duration-300 z-40
          ${
            open
              ? isMobile
                ? "fixed top-0 left-0 h-full w-64 opacity-100"
                : "w-64 opacity-100"
              : isMobile
              ? "fixed top-0 -left-full h-full w-64 opacity-0 pointer-events-none"
              : "w-0 opacity-0 pointer-events-none"
          }`}
      >
        {open &&
          items.map((it) => (
            <button
              key={it.id}
              onClick={() => {
                setActive(it.id);
                if (isMobile) setOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition
                ${
                  active === it.id
                    ? "bg-black/30 text-white"
                    : "hover:bg-black/10 text-black"
                }`}
            >
              {it.label}
            </button>
          ))}
      </aside>

      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`absolute top-1/2 -translate-y-1/2 transition-all duration-300 z-50
          bg-sky-500 text-white px-3 py-2 rounded-md shadow-md
          ${open ? "left-64" : "left-3"}`}
      >
        {open ? "<<" : ">>"}
      </button>

      {/* Overlay for mobile */}
      {isMobile && open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
        ></div>
      )}
    </>
  );
}
