import { Component, OnInit, OnDestroy, ViewChild, ElementRef, viewChild } from '@angular/core';
import { TimerService, TimerState, SessionType } from '../timer.service';
import { Observable, Subscription, } from 'rxjs';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.css']
})
export class TimerComponent implements OnInit {
  @ViewChild('audioPlayer') audioPlayerRef!: ElementRef<HTMLAudioElement>;
  private sessionEndSubscription!: Subscription;

  
  playNotificationSound(): void {
    if (this.audioPlayerRef) {
      this.audioPlayerRef.nativeElement.currentTime = 0;
      this.audioPlayerRef.nativeElement.play();
    }
  }
  // Expose the state Observable to the template using the async pipe
  public timerState$!: Observable<TimerState>;
  
  // Expose the SessionType enum to the template for comparison
  public SessionType = SessionType;

  constructor(public timerService: TimerService) {}

  public themeClass$!: Observable<string>;

  ngOnInit(): void{
    this.timerState$ = this.timerService.timerState$;
    this.themeClass$ = this.timerState$.pipe(
      map(state =>
        state.sessionType === SessionType.Work ? 'work-mode' : 'break-mode'
      )
    );
    this.sessionEndSubscription = this.timerService.sessionEnded$.subscribe(() => {
      this.playNotificationSound();
    });
  }

  ngOnDestroy(): void {
    if (this.sessionEndSubscription) {
      this.sessionEndSubscription.unsubscribe();
    }
  }

  onStart(): void {
    this.timerService.start();
  }

  onPause(): void {
    this.timerService.pause();
  }

  onReset(): void {
    this.timerService.reset();
  }

  // Converts total seconds into "MM:SS" format for display
  formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    // Pad with a leading zero if necessary
    const displayMinutes = String(minutes).padStart(2, '0');
    const displaySeconds = String(seconds).padStart(2, '0');
    
    return `${displayMinutes}:${displaySeconds}`;
  }
}