import { Howl } from "howler";

// Sound effect types for different actions
export enum CompletionSoundEffect {
  SUCCESS = "SUCCESS",
  ACHIEVEMENT = "ACHIEVEMENT", 
  TASK_COMPLETE = "TASK_COMPLETE",
  QUESTION_COMPLETE = "QUESTION_COMPLETE"
}

// Paths to completion sound effects
export const pathsToCompletionSounds = {
  SUCCESS: "/sounds/bell.wav", // Updated to use sounds directory
  ACHIEVEMENT: "/sounds/fancy.wav", // Updated to use sounds directory
  TASK_COMPLETE: "/sounds/digital.wav", // Updated to use sounds directory
  QUESTION_COMPLETE: "/sounds/analog.wav", // Updated to use sounds directory
} as const;

// Default volumes for different sound types
const DEFAULT_VOLUMES = {
  SUCCESS: 0.6,
  ACHIEVEMENT: 0.7,
  TASK_COMPLETE: 0.5,
  QUESTION_COMPLETE: 0.6,
} as const;

/**
 * Play a completion sound effect
 * @param soundType - Type of completion sound to play
 * @param volume - Volume level (0-1), defaults to sound-specific level
 * @param soundsEnabled - Whether sounds are enabled (defaults to true)
 */
export function playCompletionSound(
  soundType: CompletionSoundEffect,
  volume?: number,
  soundsEnabled: boolean = true
): void {
  // Don't play sound if sounds are disabled
  if (!soundsEnabled) {
    return;
  }

  try {
    const soundPath = pathsToCompletionSounds[soundType];
    const soundVolume = volume ?? DEFAULT_VOLUMES[soundType];

    const sound = new Howl({
      src: soundPath,
      html5: true,
      volume: soundVolume,
      onloaderror: (id, error) => {
        console.warn(`Failed to load completion sound ${soundType}:`, error);
      },
      onplayerror: (id, error) => {
        console.warn(`Failed to play completion sound ${soundType}:`, error);
      }
    });

    sound.play();
  } catch (error) {
    console.warn(`Error playing completion sound ${soundType}:`, error);
  }
}

/**
 * Play task completion sound
 * @param volume - Optional volume override
 * @param soundsEnabled - Whether sounds are enabled (defaults to true)
 */
export function playTaskCompletionSound(volume?: number, soundsEnabled: boolean = true): void {
  playCompletionSound(CompletionSoundEffect.TASK_COMPLETE, volume, soundsEnabled);
}

/**
 * Play DSA question completion sound
 * @param volume - Optional volume override
 * @param soundsEnabled - Whether sounds are enabled (defaults to true)
 */
export function playQuestionCompletionSound(volume?: number, soundsEnabled: boolean = true): void {
  playCompletionSound(CompletionSoundEffect.QUESTION_COMPLETE, volume, soundsEnabled);
}

/**
 * Play general success sound
 * @param volume - Optional volume override
 * @param soundsEnabled - Whether sounds are enabled (defaults to true)
 */
export function playSuccessSound(volume?: number, soundsEnabled: boolean = true): void {
  playCompletionSound(CompletionSoundEffect.SUCCESS, volume, soundsEnabled);
}

/**
 * Play achievement sound
 * @param volume - Optional volume override
 * @param soundsEnabled - Whether sounds are enabled (defaults to true)
 */
export function playAchievementSound(volume?: number, soundsEnabled: boolean = true): void {
  playCompletionSound(CompletionSoundEffect.ACHIEVEMENT, volume, soundsEnabled);
}
