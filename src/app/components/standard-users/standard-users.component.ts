import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { DistributionService } from '../../services/distribution/distribution.service';
import { standardUser } from '../../models/standardUser.model';
import { MatSortModule } from '@angular/material/sort';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PostgraduateStudiesComponent } from '../shared/postgraduate-studies/postgraduate-studies.component';

import { SchoolYearService } from '../../services/schoolYear/school-year.service';
import { SchoolYear } from '../../models/schoolYear.model';

@Component({
  selector: 'app-standard-users',
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    PostgraduateStudiesComponent
  ],
  templateUrl: './standard-users.component.html',
  standalone: true,
  styleUrl: './standard-users.component.css'
})
export class StandardUsersComponent implements OnInit {
  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<any>;
  standardUser: standardUser[] = [];

  user: any;
  username: any;
  isDistributionButtonDisabled: boolean = true;

  schoolYears: SchoolYear[] = [];
  activeYear: string = '';

  totalLectures = 0;
  totalExercises = 0;
  weeklyLecturesE = 0;
  weeklyExercisesE = 0;
  weeklyLecturesO = 0;
  weeklyExercisesO = 0;

  teacherId: number | null = null;

  columnNamesMap: { [key: string]: string } = {
    name: 'Predmet',
    studyProgram: 'Studijski program',
    semester: 'Semestar',
    countHours: 'Broj časova',
    sessionCount: 'Broj termina',
    leftSessionCount: 'Preostali termini',
    classType: 'Vrsta',
  };

  constructor(
    private distributionService: DistributionService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private schoolYearService: SchoolYearService
  ) {
    this.dataSource = new MatTableDataSource<any>();
  }

  ngOnInit(): void {
    this.loadSchoolYears();

    this.route.queryParams.subscribe(params => {
      const emailFromUrl = params['email'];
      this.user = emailFromUrl || this.authService.getEmail();

      this.loadTeacherData();
    });
  }

  loadSchoolYears(): void {
    this.schoolYearService.getAllSchoolYears().subscribe((years: SchoolYear[]) => {
      this.schoolYears = years.sort((a, b) =>
        parseInt(b.label.split('/')[0], 10) - parseInt(a.label.split('/')[0], 10)
      );

      const active = this.schoolYears.find(year => year.active);

      if (active) {
        this.selectSchoolYear(active);
      } else if (this.schoolYears.length > 0) {
        this.selectSchoolYear(this.schoolYears[0]);
      }
    });
  }

  selectSchoolYear(year: any): void {
    console.log('Izabrana godina objekat:', year);

    this.activeYear = year.label || year.oznaka;
    this.schoolYearService.setYear(year);

    const schoolYearId =
      year.id ??
      year.id_skolska_godina ??
      year.schoolYearId ??
      year.idSkolskaGodina;

    if (!schoolYearId) {
      console.error('Nema schoolYear ID', year);
      return;
    }

    this.loadTeacherDataByYear(schoolYearId);
  }

  loadTeacherDataByYear(schoolYearId: number): void {
    const meEmail = 'astojanovic725m3@raf.rs';

    this.distributionService.getStandardUserByYear(this.user, schoolYearId).subscribe((standardUsers) => {
      this.standardUser = standardUsers.map(user => ({
        ...user,
        countHours: user.classType === 'vezbe' ? user.exerciseHours : user.lectureHours
      }));

      this.dataSource.data = this.standardUser;

      this.displayedColumns = [
        'name',
        'studyProgram',
        'semester',
        'countHours',
        'sessionCount',
        'leftSessionCount',
        'classType'
      ];

      if (this.standardUser.length > 0) {
        this.teacherId = this.standardUser[0].teacherId;
        this.calculateSummaryFromData();

        if (this.user === meEmail) {
          this.username = 'Aleksandar Stojanovic';
        } else {
          const { firstName, lastName } = this.standardUser[0];
          this.username = `${firstName} ${lastName}`;
        }
      } else {
        this.teacherId = null;
        this.username = 'Nepoznat korisnik';
        this.calculateSummaryFromData();
      }
    });
  }

  loadTeacherData(): void {
    const meEmail = 'astojanovic725m3@raf.rs';

    this.distributionService.getStandardUser(this.user).subscribe((standardUsers) => {
      this.standardUser = standardUsers.map(user => ({
        ...user,
        countHours: user.classType === 'vezbe' ? user.exerciseHours : user.lectureHours
      }));

      this.dataSource.data = this.standardUser;

      this.displayedColumns = [
        'name',
        'studyProgram',
        'semester',
        'countHours',
        'sessionCount',
        'leftSessionCount',
        'classType'
      ];

      if (this.standardUser.length > 0) {
        this.teacherId = this.standardUser[0].teacherId;

        this.calculateSummaryFromData();

        if (this.user === meEmail) {
          this.username = 'Aleksandar Stojanovic';
        } else {
          const { firstName, lastName } = this.standardUser[0];
          this.username = `${firstName} ${lastName}`;
        }
      } else {
        this.teacherId = null;
        this.username = 'Nepoznat korisnik';
        this.calculateSummaryFromData();
      }
    });
  }

  calculateSummaryFromData(): void {
    this.weeklyLecturesE = 0;
    this.weeklyExercisesE = 0;
    this.weeklyLecturesO = 0;
    this.weeklyExercisesO = 0;
    this.totalLectures = 0;
    this.totalExercises = 0;

    this.dataSource.data.forEach((row) => {
      let hoursPerWeek = 0;

      if (row.classType === 'vezbe') {
        hoursPerWeek = row.exerciseHours ?? 0;
      } else {
        hoursPerWeek = row.lectureHours ?? 0;
      }

      const totalHours = hoursPerWeek * row.sessionCount * 13;

      if (row.classType === 'vezbe') {
        this.totalExercises += totalHours;

        if (row.semester % 2 === 0) {
          this.weeklyExercisesE += hoursPerWeek;
        } else {
          this.weeklyExercisesO += hoursPerWeek;
        }
      } else {
        this.totalLectures += totalHours;

        if (row.semester % 2 === 0) {
          this.weeklyLecturesE += hoursPerWeek;
        } else {
          this.weeklyLecturesO += hoursPerWeek;
        }
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
  }
}
