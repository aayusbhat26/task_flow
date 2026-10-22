import { db } from "@/lib/db";
import type { UserPermission } from "@prisma/client";

export interface ChatScopeInput {
  workspaceId?: string | null;
  groupId?: string | null;
  channelId?: string | null;
}

export interface ChatAccess {
  workspaceId: string;
  groupId?: string | null;
  channelId?: string | null;
  role: UserPermission;
}

export type ChatAccessResult = {
  ok: boolean;
  access?: ChatAccess;
  status?: number;
  error?: string;
};

export async function resolveChatAccess(
  userId: string,
  input: ChatScopeInput
): Promise<ChatAccessResult> {
  if (input.channelId) {
    const channel = await db.channel.findUnique({
      where: { id: input.channelId },
      select: { id: true, workspaceId: true },
    });

    if (!channel) {
      return { ok: false, status: 404, error: "Channel not found" };
    }
    if (input.workspaceId && channel.workspaceId !== input.workspaceId) {
      return { ok: false, status: 400, error: "Channel does not belong to workspace" };
    }

    const subscription = await db.subscription.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId: channel.workspaceId },
      },
      select: { userRole: true },
    });
    if (!subscription) {
      return { ok: false, status: 403, error: "Access denied to this channel" };
    }

    return {
      ok: true,
      access: {
        workspaceId: channel.workspaceId,
        channelId: channel.id,
        role: subscription.userRole,
      },
    };
  }

  if (input.groupId) {
    const group = await db.group.findFirst({
      where: { id: input.groupId, members: { some: { id: userId } } },
      select: { id: true, workspaceId: true },
    });
    if (!group) {
      return { ok: false, status: 403, error: "Access denied to this group" };
    }

    const subscription = await db.subscription.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId: group.workspaceId },
      },
      select: { userRole: true },
    });

    return {
      ok: true,
      access: {
        workspaceId: group.workspaceId,
        groupId: group.id,
        role: subscription?.userRole ?? "READ_ONLY",
      },
    };
  }

  if (input.workspaceId) {
    const subscription = await db.subscription.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId: input.workspaceId },
      },
      select: { userRole: true },
    });
    if (!subscription) {
      return { ok: false, status: 403, error: "Access denied to this workspace" };
    }

    return {
      ok: true,
      access: {
        workspaceId: input.workspaceId,
        role: subscription.userRole,
      },
    };
  }

  return { ok: false, status: 400, error: "Workspace, group or channel is required" };
}

export function canWrite(access: ChatAccess) {
  return access.role !== "READ_ONLY";
}

export function chatScopeWhere(access: ChatAccess) {
  if (access.channelId) {
    return { channelId: access.channelId };
  }
  if (access.groupId) {
    return { groupId: access.groupId };
  }
  return {
    workspaceId: access.workspaceId,
    groupId: null,
    channelId: null,
  };
}
