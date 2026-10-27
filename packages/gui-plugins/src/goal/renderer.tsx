import { ComposerPill, type ComposerPillProps, type ComposerPillRow, type Plugin } from "@opencode/plugin/gui"
import { SessionGoal } from "@opencode/schema/session-goal"
import { showToast } from "@opencode/ui/toast"
import type Goal from "./index"

const status = {
  active: { label: "title", icon: "status-active", tone: undefined },
  paused: { label: "paused", icon: "status", tone: "warning" },
  complete: { label: "met", icon: "circle-check", tone: "success" },
} as const

/**
 * The session's `/goal` above its composer: the status as a pill, and a menu with the objective, the last reason and
 * the actions that apply. The server's goal plugin keeps the goal in the session's metadata.
 */
const setup: Plugin.Setup<typeof Goal> = (ctx) => {
  const command = (input: ComposerPillProps, text: "pause" | "resume" | "clear") =>
    void input.session.server.client.session
      .command({ sessionID: input.session.id, name: "goal", text })
      .catch((cause: unknown) =>
        showToast({
          variant: "error",
          title: ctx.t("common.requestFailed"),
          description: cause instanceof Error ? cause.message : String(cause),
        }),
      )

  ctx.add(ComposerPill, {
    id: "goal",
    show: (input) => {
      const session = input.session.server.data.session.get(input.session.id)
      // A goal copied from the parent belongs to the parent, so only the session's own goal shows.
      const goal = session && SessionGoal.fromMetadata(session.id, session.metadata)

      if (!goal) return

      const view = status[goal.status]
      const rows: ComposerPillRow[] = [{ id: "objective", label: goal.objective, icon: "task" }]

      if (goal.reason) rows.push({ id: "reason", label: goal.reason, icon: "info" })

      if (goal.status === "active")
        rows.push({ id: "pause", label: ctx.t("pause"), icon: "stop", run: () => command(input, "pause") })

      if (goal.status === "paused")
        rows.push({ id: "resume", label: ctx.t("resume"), icon: "refresh", run: () => command(input, "resume") })

      rows.push({ id: "clear", label: ctx.t("clear"), icon: "outline-trash", run: () => command(input, "clear") })

      return { label: ctx.t(view.label), icon: view.icon, tone: view.tone, title: ctx.t("title"), rows }
    },
  })
}

export default setup
