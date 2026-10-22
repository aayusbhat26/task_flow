"use client";

import { pathsToSoundEffects } from "@/lib/utils";
import { PomodoroSettings } from "@prisma/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import { Button } from "@/components/ui/button";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";

type Phase = "work" | "shortBreak" | "longBreak" | "done";

interface Props {
  pomodoroSettings: PomodoroSettings;
  workspaceId?: string;
}

export const PomodoContainer = ({
  pomodoroSettings: {
    longBreakDuration,
    longBreakInterval,
    rounds,
    shortBreakDuration,
    workDuration,
    soundEffect,
    soundEffectVolume,
  },
  workspaceId,
}: Props) => {
  const [phase, setPhase] = useState<Phase>("work");
  const [round, setRound] = useState(1);
  const [remaining, setRemaining] = useState(workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const phaseRef = useRef<Phase>(phase);
  const roundRef = useRef(round);
  const runningRef = useRef(isRunning);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations("POMODORO.TIMER");

  phaseRef.current = phase;
  roundRef.current = round;
  runningRef.current = isRunning;

  const phaseSeconds = useCallback(
    (nextPhase: Phase) => {
      if (nextPhase === "work") return workDuration * 60;
      if (nextPhase === "shortBreak") return shortBreakDuration * 60;
      if (nextPhase === "longBreak") return longBreakDuration * 60;
      return 0;
    },
    [workDuration, shortBreakDuration, longBreakDuration]
  );

  const playAlarm = useCallback(() => {
    try {
      const sound = new Howl({
        src: pathsToSoundEffects[soundEffect],
        html5: true,
        volume: soundEffectVolume,
      });
      sound.play();
    } catch {
      // A missing sound should never stop the timer.
    }
  }, [soundEffect, soundEffectVolume]);

  const awardPomodoroPoints = useCallback(
    async (duration: number) => {
      try {
        const response = await axios.post("/api/pomodoro/complete", {
          duration,
          workspaceId,
        });

        if (response.data.success) {
          queryClient.invalidateQueries({ queryKey: ["userPoints"] });
          toast({
            title: "Focus round complete",
            description: response.data.message,
          });
        }
      } catch {
        toast({
          title: "Focus round complete",
          description: "The session finished, but points could not be saved.",
          variant: "destructive",
        });
      }
    },
    [workspaceId, toast, queryClient]
  );

  const advancePhase = useCallback(
    (skipped = false) => {
      const currentPhase = phaseRef.current;
      const currentRound = roundRef.current;

      setIsRunning(false);
      playAlarm();

      if (currentPhase === "work") {
        if (!skipped) awardPomodoroPoints(workDuration);

        if (currentRound >= rounds) {
          setPhase("done");
          setRemaining(0);
          return;
        }

        const nextPhase =
          currentRound % longBreakInterval === 0 ? "longBreak" : "shortBreak";
        setPhase(nextPhase);
        setRemaining(phaseSeconds(nextPhase));
        return;
      }

      if (currentPhase === "shortBreak" || currentPhase === "longBreak") {
        setRound(currentRound + 1);
        setPhase("work");
        setRemaining(phaseSeconds("work"));
      }
    },
    [
      awardPomodoroPoints,
      longBreakInterval,
      phaseSeconds,
      playAlarm,
      rounds,
      workDuration,
    ]
  );

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (isRunning && remaining === 0) {
      advancePhase(false);
    }
  }, [remaining, isRunning, advancePhase]);

  const resetPomodoro = () => {
    setIsRunning(false);
    setPhase("work");
    setRound(1);
    setRemaining(workDuration * 60);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  const totalForPhase = phaseSeconds(phase);
  const progress = totalForPhase
    ? ((totalForPhase - remaining) / totalForPhase) * 100
    : 100;

  const phaseLabel =
    phase === "work" ? t("FOCUS") : phase === "done" ? "" : t("BREAK");

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      <div className="border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="eyebrow">
              {phase === "done" ? "Session complete" : phaseLabel}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {t("ROUNDS.FIRST")} {Math.min(round, rounds)} / {rounds}
            </p>
          </div>
        </div>

        <div className="px-6 py-14 text-center sm:py-20">
          {phase === "done" ? (
            <div className="py-4">
              <p className="font-display text-5xl leading-tight sm:text-6xl">
                Good work.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                {rounds} focus {rounds === 1 ? "round" : "rounds"} completed.
                Take a longer pause before the next session.
              </p>
            </div>
          ) : (
            <>
              <p className="font-mono text-[7rem] leading-none tracking-[-0.06em] sm:text-[10rem]">
                {formattedTime}
              </p>
              <div className="mx-auto mt-10 h-1 w-full max-w-md bg-muted">
                <div
                  className="h-full bg-primary transition-[width] duration-500"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <div className="mt-6 flex items-center justify-center gap-2">
                {Array.from({ length: rounds }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-1.5 w-6 ${
                      index + 1 < round
                        ? "bg-primary"
                        : index + 1 === round
                          ? "bg-foreground/50"
                          : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border px-6 py-5">
          {phase === "done" ? (
            <Button onClick={resetPomodoro} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              {t("NEW")}
            </Button>
          ) : (
            <>
              <Button
                onClick={() => setIsRunning((value) => !value)}
                className="h-11 min-w-[128px] gap-2"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    {t("START")}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-11 gap-2"
                onClick={() => {
                  setIsRunning(false);
                  setPhase("work");
                  setRound(1);
                  setRemaining(workDuration * 60);
                }}
                title="Reset timer"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 text-muted-foreground"
                onClick={() => advancePhase(true)}
                title="Skip this phase"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <p className="mt-5 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
        {workDuration} min focus · {shortBreakDuration} min short break ·{" "}
        {longBreakDuration} min long break
      </p>
    </div>
  );
};
