import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription, Subject } from 'rxjs';
import { switchMap, tap, map, scan, takeWhile } from 'rxjs/operators';

// Define the session types and their default durations in seconds
export enum SessionType {
  Work = 'Work',
  ShortBreak = 'Short Break',
  LongBreak = 'Long Break',
}

const DURATIONS_SECONDS = {
  [SessionType.Work]: 25 * 60, // 25 minutes
  [SessionType.ShortBreak]: 5 * 60, // 5 minutes
  [SessionType.LongBreak]: 15 * 60, // 15 minutes
};

// Define the structure for the timer state
export interface TimerState {
  timeRemaining: number;
  sessionType: SessionType;
  isRunning: boolean;
  completedWorkSessions: number;
}

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private timerSubscription: Subscription | null = null;
  private WorkSessionCount = 0;
  private readonly initialTime = DURATIONS_SECONDS[SessionType.Work];
  private sessionEndedSubject = new Subject<void>();
  public sessionEnded$ = this.sessionEndedSubject.asObservable();

  // BehaviorSubject to hold and emit the current timer state
  public timerStateSubject = new BehaviorSubject<TimerState>({
    timeRemaining: this.initialTime,
    sessionType: SessionType.Work,
    isRunning: false,
    completedWorkSessions: 0,
  });

  // Public observable for components to subscribe to
  public timerState$ = this.timerStateSubject.asObservable();

  constructor() {}

  /** Starts or resumes the countdown. */
  start(): void {
    const currentState = this.timerStateSubject.value;

    if (currentState.isRunning || currentState.timeRemaining <= 0) {
      // Prevent starting if already running or if time is 0 (should switch session)
      return;
    }

    this.timerStateSubject.next({ ...currentState, isRunning: true });

    // Stop any existing interval subscription
    this.timerSubscription?.unsubscribe();

    // Create a new stream: interval(1000) emits every second
    this.timerSubscription = interval(1000)
      .pipe(
        // Start counting down from the current timeRemaining
        map(() => -1),
        scan((acc: number, val: number) => acc + val, currentState.timeRemaining),
        tap((time) => {
          // Update the state with the new time
          this.timerStateSubject.next({
            ...this.timerStateSubject.value,
            timeRemaining: time,
          });
        }),
        // Stop the stream when time reaches zero
        takeWhile((time) => time >= 0)
      )
      .subscribe({
        complete: () => {
          this.sessionEndedSubject.next();
          // Timer finished, automatically switch to the next session
          this.switchSession();
        },
      });
  }

  /** Pauses the countdown. */
  pause(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
    this.timerStateSubject.next({ ...this.timerStateSubject.value, isRunning: false });
  }

  /** Resets the timer to the current session's default duration. */
  reset(): void {
    this.pause();
    const currentType = this.timerStateSubject.value.sessionType;
    const currentCount = this.timerStateSubject.value.completedWorkSessions;
    this.timerStateSubject.next({
      timeRemaining: DURATIONS_SECONDS[currentType],
      sessionType: currentType,
      isRunning: false,
      completedWorkSessions: currentCount,
    });
  }

  /** Logic to determine and switch to the next session type. */
  private switchSession(): void {
    let nextType: SessionType;
    const currentType = this.timerStateSubject.value.sessionType;

    if (currentType === SessionType.Work) {
      // Simple logic: alternate between work and short break (could be expanded for long break)
      this.WorkSessionCount++;
      if (this.WorkSessionCount >= 4) {
        nextType = SessionType.LongBreak;
        this.WorkSessionCount = 0; 
      } else {
        nextType = SessionType.ShortBreak;
      }
    } else {
      nextType = SessionType.Work;
      if (currentType === SessionType.LongBreak) {
        this.WorkSessionCount = 0;
      }
    }

    // Set the new state
    this.timerStateSubject.next({
      timeRemaining: DURATIONS_SECONDS[nextType],
      sessionType: nextType,
      isRunning: false, // Wait for user to explicitly start
      completedWorkSessions: this.WorkSessionCount,
    });
    
    // Auto-start the new session if desired, otherwise, wait for user click
    // this.start(); 
  }

  // Helper for components to easily change the session manually
  setSession(type: SessionType): void {
    const currentCount = this.timerStateSubject.value.completedWorkSessions;
      this.pause();
      this.timerStateSubject.next({
          timeRemaining: DURATIONS_SECONDS[type],
          sessionType: type,
          isRunning: false,
          completedWorkSessions: currentCount,
      });
  }
}