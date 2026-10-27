import { ComposerPill, type ComposerPillAction, type ComposerPillProps, type Plugin } from "@opencode/plugin/gui"
import { SessionGoal } from "@opencode/schema/session-goal"
import { showToast } from "@opencode/ui/toast"
import type Goal from "./index"

const status = {
  active: { label: "title", icon: "outline-steer", tone: undefined },
  paused: { label: "paused", icon: "circle-exclamation", tone: "warning" },
  complete: { label: "met", icon: "circle-check", tone: "success" },
} as const

/**
 * The session's `/goal` above its composer: the status as a pill, and a menu headed by the objective with the actions
 * that apply. The server's goal plugin keeps the goal in the session's metadata; a bare `/goal` shows the last reason.
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
      const actions: ComposerPillAction[] = []

      if (goal.status === "active")
        actions.push({ id: "pause", label: ctx.t("pause"), icon: "stop", run: () => command(input, "pause") })

      if (goal.status === "paused")
        actions.push({ id: "resume", label: ctx.t("resume"), icon: "refresh", run: () => command(input, "resume") })

      actions.push({ id: "clear", label: ctx.t("clear"), icon: "outline-trash", run: () => command(input, "clear") })

      return { label: ctx.t(view.label), icon: view.icon, tone: view.tone, title: goal.objective, actions }
    },
  })
}

export default setup
