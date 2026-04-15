import {Component, OnInit} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatPaginatorModule} from '@angular/material/paginator';
import {CommonModule} from '@angular/common';
import {DistributionService} from '../../services/distribution/distribution.service';
import {standardUser} from '../../models/standardUser.model';
import {MatSortModule} from '@angular/material/sort';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import { PostgraduateStudiesComponent } from '../shared/postgraduate-studies/postgraduate-studies.component';


@Component({
  selector: 'app-standard-users',
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatFormFieldModule, MatInputModule, PostgraduateStudiesComponent],
  templateUrl: './standard-users.component.html',
  standalone: true,
  styleUrl: './standard-users.component.css'
})
export class StandardUsersComponent implements OnInit{
  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<any>;
  standardUser : standardUser[] = [];
  user: any;
  username : any
  isDistributionButtonDisabled: boolean = true;

  totalLectures = 0;
  totalExercises = 0;
  weeklyLecturesE = 0;
  weeklyExercisesE = 0;
  weeklyLecturesO = 0;
  weeklyExercisesO = 0;

  teacherId: number | null = null;



  // @ViewChild(MatPaginator) paginator!: MatPaginator;

  columnNamesMap: { [key: string]: string } = {
    name: 'Predmet',
    studyProgram: 'Studijski program',
    semester: 'Semestar',
    countHours: 'Broj časova',
    sessionCount:'Broj termina',
    leftSessionCount: 'Preostali termini',
    classType: 'Vrsta',
  };

  constructor(private distributionService: DistributionService,
              private authService: AuthService,
              private route: ActivatedRoute) {
    this.dataSource = new MatTableDataSource<any>();
  }

  calculateSummaryFromData() {
    this.weeklyLecturesE = 0;
    this.weeklyExercisesE = 0;
    this.weeklyLecturesO = 0;
    this.weeklyExercisesO = 0;
    this.totalLectures = 0;
    this.totalExercises = 0;

    this.dataSource.data.forEach((row) => {
      // console.log('Red podataka:', row);

      let hoursPerWeek = 0;
      // console.log("classType->",row);
      if (row.classType === "vezbe") {
        hoursPerWeek = row.exerciseHours ?? 0;
      } else {
        hoursPerWeek = row.lectureHours ?? 0;
      }

      const totalHours = hoursPerWeek * row.sessionCount *13;

      if (row.classType === "vezbe") {
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



  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const emailFromUrl = params['email'];
      this.user = emailFromUrl || this.authService.getEmail();
      console.log("User email je: ", this.user);
      const meEmail = "astojanovic725m3@raf.rs"


      this.distributionService.getStandardUser(this.user).subscribe((standardUsers) => {
        this.standardUser = standardUsers.map(user => ({
          ...user,
          countHours: user.classType === 'vezbe' ? user.exerciseHours : user.lectureHours
        }));
        this.dataSource.data = this.standardUser;
        this.displayedColumns = ['name', 'studyProgram', 'semester', 'countHours', 'sessionCount', 'leftSessionCount', 'classType'];

        if (this.standardUser.length > 0) {
          this.teacherId = this.standardUser[0].teacherId;
          console.log('STANDARD USER 0:', this.standardUser[0]);
          console.log('teacherId:', this.standardUser[0]?.teacherId);
          this.calculateSummaryFromData();
          if(this.user === meEmail){
            this.username = "Aleksandar Stojanovic";
          } else {
            const { firstName, lastName } = this.standardUser[0];
            this.username = `${firstName} ${lastName}`;
          }
        } else {
          this.username = 'Nepoznat korisnik';
        }
      });

    });
  }



  onLogout(): void {
    this.authService.logout();
  }
}
