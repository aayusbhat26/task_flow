"use client";

import { topSidebarLinks } from "@/lib/utils";

import { SidebarLink } from "./SidebarLink";

interface Props {
  showDSA: boolean;
}

export const Top = ({ showDSA }: Props) => {
  const links = showDSA
    ? topSidebarLinks
    : topSidebarLinks.filter(link => !link.href.includes("/dsa") && !link.href.includes("/gaming"));

  return (
    <div className="flex flex-col items-center gap-3">
      {links.map((link, i) => (
        <SidebarLink
          key={`link_${i}`}
          Icon={link.Icon}
          hoverTextKey={link.hoverTextKey}
          href={link.href}
          include={link?.include}
        />
      ))}
    </div>
  );
};
