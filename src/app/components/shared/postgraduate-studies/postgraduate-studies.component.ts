import { CommonModule } from '@angular/common';
import {Component, Input, OnInit, ViewChild} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MasterClassModalComponent} from '../../master-class-modal/master-class-modal.component';
import {Distribution} from '../../../models/distribution.model';
import {MatTableDataSource} from '@angular/material/table';
import {Subject} from '../../../models/subject.model';
import {TeacherSummary} from '../../../models/teacherSummary.model';
import {Teacher} from '../../../models/teacher.model';
import {TeachersService} from '../../../services/teacher/teachers.service';
import {SubjectService} from '../../../services/subject/subject.service';
import {DistributionService} from '../../../services/distribution/distribution.service';
import {SchoolYearService} from '../../../services/schoolYear/school-year.service';
import {MasterClassService} from '../../../services/masterClass/master-class.service';
import {Modal} from 'bootstrap';



@Component({
  selector: 'app-postgraduate-studies',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatMenuModule,
    MatPaginatorModule,
    MasterClassModalComponent
  ],
  templateUrl: './postgraduate-studies.component.html',
  styleUrls: ['./postgraduate-studies.component.css']
})
export class PostgraduateStudiesComponent implements OnInit{
  @Input() teacherId!: number;
  @Input() canEdit: boolean = true;

  @ViewChild('masterModal') masterModal!: MasterClassModalComponent;


  selectedPostModule: 'NONE' | 'MASTER' | 'DOKTORSKE' = 'NONE'


  extraMasterClasses: number = 0;
  extraDoctoralClasses: number = 0;
  mentorCommissionInfo: number = 0;
  masterClasses: any[] = [];
  selectedLevel: string = "";
  subjects: Subject[] = [];
  filteredSubjects: Subject[] = [];
  showDropdown: boolean = false;
  extraOtherActivities: number = 0;


  postAcademicActivity = {
    subject: '',
    hoursHeld: null as number | null,
    masterDate: new Date(),
    selectedLevel: '',
    note: ''
  };

  otherAcademicActivity = {
    subject: '',
    hoursHeld: null as number | null,
    masterDate: new Date(),
    selectedLevel: '',
    note: ''
  };


  onSubjectFocus(): void {
    this.filteredSubjects = this.subjects;
    this.showDropdown = true;
  }


  filterSubjects(): void {
    const value = this.postAcademicActivity.subject.toLowerCase();

    if (!value) {
      // ako je input prazan → prikaži sve
      this.filteredSubjects = this.subjects;
    } else {
      this.filteredSubjects = this.subjects.filter(s =>
        s.name.toLowerCase().includes(value)
      );
    }

    this.showDropdown = this.filteredSubjects.length > 0;
  }

  selectSubject(subject: Subject): void {
    this.postAcademicActivity.subject = subject.name;
    this.showDropdown = false;
  }



  loadTotalClassesAsync() {
    const intervalId = setInterval(() => {
      if (this.teacherId) {
        console.log("Ucitao sam ukupan broj casova");
        this.masterService.triggerCountEvent(this.teacherId);

        clearInterval(intervalId); // zaustavi interval kada imamo podatak
      }
    }, 100); // proverava svakih 500 milisekundi (pola sekunde)

    this.masterService.onCountChanged().subscribe(value => {
      console.log("Ovo je stiglo iz deteta:", value);
      this.extraMasterClasses = value;
    })
  }

  loadTotalDoctoralClassesAsync() {
    const intervalId = setInterval(() => {
      if (this.teacherId) {
        console.log("Ucitao sam ukupan broj casova");
        this.masterService.triggerDoctoralCountEvent(this.teacherId);

        clearInterval(intervalId); // zaustavi interval kada imamo podatak
      }
    }, 100); // proverava svakih 500 milisekundi (pola sekunde)

    this.masterService.onDoctoralCountChanged().subscribe(value => {
      console.log("Ovo je stiglo iz deteta:", value);
      this.extraDoctoralClasses = value;
    })
  }


  loadTotalMentorCommissionInfo() {
    const intervalId = setInterval(() => {
      if (this.teacherId) {
        console.log("Ucitao sam ukupan broj casova");
        this.masterService.triggerMentorCommissionCountEvent(this.teacherId);

        clearInterval(intervalId); // zaustavi interval kada imamo podatak
      }
    }, 100); // proverava svakih 500 milisekundi (pola sekunde)

    this.masterService.onMentorCommissionChange().subscribe(value => {
      console.log("Ovo je stiglo iz deteta:", value);
      this.mentorCommissionInfo = value;
    })
  }

  // ngAfterViewInit() {
  //   console.log('Modal komponenta inicijalizovana:', this.masterModal);
  //
  // }

  doctoralActivity = {
    type: '',
    studentName: '',
    topic: '',
    degree: '',
    note: ''
  };



  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // columnNamesMap: { [key: string]: string } = {
  //   firstName: 'Ime',
  //   lastName: 'Prezime',
  //   title: 'Zvanje',
  //   name: 'Naziv predmeta',
  //   studyProgram: 'Studijski program',
  //   semester: 'Semestar',
  //   countHours: 'Broj časova',
  //   lectureHours: 'Fond predavanja',
  //   exerciseHours: 'Fond vežbe',
  //   practicumHours: 'Fond praktikum',
  //   mandatory: 'Obaveznost',
  //   lectureSessions: 'Predavanja (konsultacije)',
  //   exerciseSessions: 'Vežbe (konsultacije)',
  //   classType: 'Vrsta',
  //   sessionCount:'Broj termina',
  //   teacher: 'Nastavnik',
  //   subject: 'Predmet',
  //   email : 'Email',
  //   summaryLectureHours: 'Ukupno predavanja',
  //   summaryExerciseHours: 'Ukupno vežbi',
  // };


  constructor(private subjectService: SubjectService, private schoolYearService: SchoolYearService, private masterService: MasterClassService) {

  }


  loadSubjects(): void {
    const currentYear = this.schoolYearService.getCurrentYear()?.id_skolska_godina
    this.subjectService.getSubjectsByYear(currentYear || 0).subscribe((subjects) => {
      this.subjects = subjects;
      console.log("SUBJEKTI:", this.subjects)
    });

  }

  ngOnInit(): void {
    console.log('teacherId:', this.teacherId);

    if (!this.teacherId) {
      console.warn('teacherId nije prosleđen u postgraduate component');
      return;
    }

    // učitaj broj časova itd.
    this.refresh();

    // ✅ OVDE IDE OVAJ KOD
    this.schoolYearService.selectedYear$.subscribe((year) => {
      console.log('SELECTED YEAR:', year);

      if (!year?.id_skolska_godina) {
        console.warn('Nema schoolYear ID');
        return;
      }

      this.subjectService.getSubjectsByYear(year.id_skolska_godina)
        .subscribe(subjects => {
          this.subjects = subjects;
          this.filteredSubjects = subjects;

          console.log('SUBJECTS UCITANI:', subjects);
        });
    });
  }


  // showTeachers(): void {
  //   this.dataSource.data = this.teacherSummary;
  //   this.displayedColumns = ['firstName', 'lastName', 'email', 'title','summaryLectureHours','summaryExerciseHours'];
  //   this.dataSource.paginator = this.paginator;
  //   this.isDistributionButtonDisabled = true;
  // }
  //
  // showSubjects(): void {
  //   this.dataSource.data = this.subjects;
  //   this.displayedColumns = ['name', 'studyProgram', 'semester', 'lectureHours', 'exerciseHours', 'practicumHours', 'mandatory'];
  //   this.dataSource.paginator = this.paginator;
  //   this.isDistributionButtonDisabled = true;
  // }
  //
  // applyFilter(event: Event) {
  //   const filterValue = (event.target as HTMLInputElement).value;
  //   this.dataSource.filter = filterValue.trim().toLowerCase();
  // }

  // calculateSummaryRows() {
  //   this.totalLectures = 0;
  //   this.totalExercises = 0;
  //
  //   this.dataSource.data.forEach((row) => {
  //     if(row.classType == "vezbe") {
  //       this.totalExercises += row.sessionCount ;
  //     }
  //     else {
  //       this.totalLectures += row.sessionCount;
  //     }
  //   });
  // }
  // calculateSummaryFromData() {
  //   this.weeklyLecturesE = 0;
  //   this.weeklyExercisesE = 0;
  //   this.weeklyLecturesO = 0;
  //   this.weeklyExercisesO = 0;
  //   this.totalLectures = 0;
  //   this.totalExercises = 0;
  //
  //   this.dataSource.data.forEach((row) => {
  //
  //     if(row.classType === "vezbe") {
  //       this.totalExercises += (row.countHours *13* row.sessionCount);
  //       if(row.semester % 2 == 0) {
  //         this.weeklyExercisesE += row.countHours*row.sessionCount;
  //       }else {
  //         this.weeklyExercisesO += row.countHours*row.sessionCount;
  //       }
  //     }
  //     else {
  //       this.totalLectures += (row.countHours *13* row.sessionCount);
  //       if(row.semester % 2 == 0) {
  //         this.weeklyLecturesE += row.countHours * row.sessionCount;
  //       }else {
  //         this.weeklyLecturesO += row.countHours * row.sessionCount;
  //       }
  //     }
  //   });
  // }
  //
  // onRowClicked(row: any) {
  //   if(row.hasOwnProperty('title')) {
  //     this.summaryRows = 1;
  //     this.selectedDistributions = this.distributions.filter((distribution: { teacher: any; }) => distribution.teacher.email == row.email);
  //     this.displayedColumns = ['teacher','subject', 'studyProgram', 'semester', 'countHours','sessionCount' ,'classType'];
  //     this.dataSource.paginator = this.paginator;
  //     console.log("SELECTED DISTRIBUTIONS->",this.selectedDistributions);
  //     console.log("SELECTED DISTRIBUTIONS->",this.distributions[0]);
  //   }else if (row.hasOwnProperty('name')){
  //     this.summaryRows = 2;
  //     this.displayedColumns = ['teacher','subject', 'studyProgram', 'semester', 'countHours','sessionCount' ,'classType'];
  //     this.selectedDistributions = this.distributions.filter((distribution: { subject: any; }) => distribution.subject.id === row.id);
  //     this.dataSource.paginator = this.paginator;
  //     console.log("SELECTED DISTRIBUTIONS->"+this.selectedDistributions);
  //   }
  //
  //   // Mapping data
  //   this.dataSource.data = this.selectedDistributions.map((distribution) => {
  //     return {
  //       teacher: distribution.teacher?.firstName + '  ' +distribution.teacher.lastName,
  //       studyProgram: distribution.subject?.studyProgram,
  //       semester: distribution.subject?.semester,
  //       countHours: distribution.classType === 'vezbe'
  //         ? distribution.subject?.exerciseHours
  //         : distribution.subject?.lectureHours,
  //       subject: distribution.subject?.name,
  //       classType: distribution.classType,
  //       sessionCount: distribution.sessionCount
  //     };
  //   });
  //   if(this.summaryRows == 1){
  //     this.calculateSummaryFromData();
  //   }else if(this.summaryRows == 2){
  //     this.calculateSummaryRows();
  //   }
  //   // activate distribution button
  //   this.isDistributionButtonDisabled = this.selectedDistributions.length === 0;
  // }


  refresh(): void {
    this.loadTotalMentorCommissionInfo();
    this.loadTotalClassesAsync();
    this.loadTotalDoctoralClassesAsync();
    this.loadTotalOtherActivitiesAsync();
  }

  dodajMaster() {
    this.selectedPostModule = 'MASTER';
    this.postAcademicActivity = {
      subject: '',
      hoursHeld: null as number | null,
      masterDate: new Date(),
      selectedLevel: '',
      note: ''
    };
  }

  dodajDoktorske() {
    this.selectedPostModule = 'DOKTORSKE';
    this.doctoralActivity = {
      type: '',
      studentName: '',
      topic: '',
      degree: '',
      note: ''
    };
  }

  saveMasterActivity() {

    console.log("Trenutna/Aktivna skolska godina:", this.schoolYearService.getCurrentYear()?.id_skolska_godina);
    const currentYear = this.schoolYearService.getCurrentYear();

    const newActivity = {
      predmetNaPostakademskimStudijama: this.postAcademicActivity.subject,
      odrzanoCasova: this.postAcademicActivity.hoursHeld,
      datumOdrzavanjaCasova: this.postAcademicActivity.masterDate,
      datumUnosa: new Date(),
      nastavnikId: this.teacherId,
      stepenStudija: this.postAcademicActivity.selectedLevel,
      skolskaGodinaId: currentYear?.id_skolska_godina,
      napomena: this.postAcademicActivity.note
    }

    this.masterModal.addMasterClass(newActivity);

    this.postAcademicActivity = {
      subject: '',
      hoursHeld: 0,
      masterDate: new Date(),
      selectedLevel: '',
      note: ''
    }

    this.loadTotalClassesAsync();
    this.loadTotalDoctoralClassesAsync();


  }

  saveCommissionMentorActivity() {

    const currentYear = this.schoolYearService.getCurrentYear();

    const newMentorCommissionActivity = {
      type: this.doctoralActivity.type,
      studentName: this.doctoralActivity.studentName,
      topic: this.doctoralActivity.topic,
      degree: this.doctoralActivity.degree,
      note: this.doctoralActivity.note,
      nastavnikId: this.teacherId,
      skolskaGodinaId: currentYear?.id
    }

    this.masterModal.addMentorCommissionActivity(newMentorCommissionActivity);

    this.doctoralActivity = {
      type: '',
      studentName: '',
      topic: '',
      degree: '',
      note: ''
    };

    this.loadTotalClassesAsync();
    this.loadTotalDoctoralClassesAsync();
    this.loadTotalMentorCommissionInfo();


  }

  openMentorCommissionModal() {
    if (!this.masterModal) {
      console.warn('Modal komponenta još nije inicijalizovana!');
      return;
    }

    this.masterModal.nastavnikId = this.teacherId;

    this.masterModal.loadMentorCommissionInfo().subscribe(list => {
      console.log("Lista koju dobijam u parentu:", list);
      const modalEl = document.getElementById('mentorCommissionModal');
      if (modalEl) {
        const modal = new Modal(modalEl);
        modal.show();
      }
    })

  }



  openMasterModal() {

    console.log("Otvaram master modal");

    if (!this.masterModal) {
      console.warn('Modal komponenta još nije inicijalizovana!');
      return;
    }

    this.masterModal.nastavnikId = this.teacherId;

    this.masterModal.loadMasterClasses().subscribe(list => {
      console.log("Lista koju dobijam u parentu:", list);
      const modalEl = document.getElementById('masterModal');
      if (modalEl) {
        const modal = new Modal(modalEl);
        modal.show();
      }
    });

  }

  openDoctoralModal() {

    if (!this.masterModal) {
      console.warn('Modal komponenta još nije inicijalizovana!');
      return;
    }

    this.masterModal.nastavnikId = this.teacherId;

    this.masterModal.loadDoctoralClasses().subscribe(list => {
      console.log("Lista koju dobijam u parentu:", list);
      const modalEl = document.getElementById('doctoralModal');
      if (modalEl) {
        const modal = new Modal(modalEl);
        modal.show();
      }
    });

  }

  cancelOtherActivity() {
    this.otherAcademicActivity = {
      subject: '',
      hoursHeld: null,
      masterDate: new Date(),
      selectedLevel: '',
      note: ''
    };
  }

  loadTotalOtherActivitiesAsync() {
    const intervalId = setInterval(() => {
      if (this.teacherId) {
        this.masterService.triggerOtherActivitiesCountEvent(this.teacherId);
        clearInterval(intervalId);
      }
    }, 100);

    this.masterService.onOtherActivitiesCountChanged().subscribe(value => {
      this.extraOtherActivities = value;
    });
  }

  saveOtherAcademicActivity() {
    const currentYear = this.schoolYearService.getCurrentYear();

    const newActivity = {
      predmetNaPostakademskimStudijama: this.otherAcademicActivity.subject,
      odrzanoCasova: this.otherAcademicActivity.hoursHeld,
      datumOdrzavanjaCasova: this.otherAcademicActivity.masterDate,
      datumUnosa: new Date(),
      nastavnikId: this.teacherId,
      stepenStudija: 'ostalo',
      skolskaGodinaId: currentYear?.id_skolska_godina,
      napomena: this.otherAcademicActivity.note
    };

    this.masterModal.addOtherActivity(newActivity);

    this.otherAcademicActivity = {
      subject: '',
      hoursHeld: null,
      masterDate: new Date(),
      selectedLevel: '',
      note: ''
    };

    this.loadTotalOtherActivitiesAsync();
  }

  openOtherActivitiesModal() {

    if (!this.masterModal) {
      console.warn('Modal komponenta još nije inicijalizovana!');
      return;
    }

    this.masterModal.nastavnikId = this.teacherId;

    this.masterModal.loadOtherActivities().subscribe(list => {
      console.log("Ostale aktivnosti koje dobijam u parentu:", list);

      const modalEl = document.getElementById('otherActivitiesModal');
      if (modalEl) {
        const modal = new Modal(modalEl);
        modal.show();
      }
    });

  }

}
