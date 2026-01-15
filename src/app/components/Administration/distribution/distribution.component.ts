import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Teacher} from '../../../models/teacher.model';
import {TeachersService} from '../../../services/teacher/teachers.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {Modal, Tooltip} from 'bootstrap';
import {CommonModule} from '@angular/common';
import {MatInputModule} from '@angular/material/input';
import {Subject} from '../../../models/subject.model';
import {Distribution} from '../../../models/distribution.model';
import {SubjectService} from '../../../services/subject/subject.service';
import {DistributionService} from '../../../services/distribution/distribution.service';
import {MatButtonModule} from '@angular/material/button';
import {MatSortModule} from '@angular/material/sort';
import {NgSelectModule} from '@ng-select/ng-select';
import {SchoolYearService} from '../../../services/schoolYear/school-year.service';
import {AppComponent} from '../../../app.component';

@Component({
  selector: 'app-distribution',
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, FormsModule,NgSelectModule],
  templateUrl: './distribution.component.html',
  standalone: true,
  styleUrl: './distribution.component.css'
})
export class DistributionComponent implements OnInit, AfterViewInit{
  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<any>;
  distributionForm: FormGroup;
  teachers : Teacher[] = [];
  subjects : Subject[] = [];
  distributions: Distribution[] = [];
  createNewDistribution: boolean = true;
  distributionSubject: string = '';

  distributionId: number = 0;
  classTypes: Array<string> = [];
  activeOption: string = 'first';
  selected: "ALL" | "WINTER" | "SUMMER" = "ALL";
  allDistributions: Distribution[] = [];
  filteredDistributions: Distribution[] = [];
  selectedYear: string = "0";
  selectedYearId: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  columnNamesMap: { [key: string]: string } = {
    teacher: 'Nastavnik',
    subject: 'Predmet',
    studyProgram: 'Studijski program',
    semester: 'Semestar',
    countHours: 'Broj časova',
    sessionCount:'Broj termina',
    leftSessionCount: 'Preostali termini',
    classType: 'Vrsta',
    actions: 'Akcije',
    email: 'Email',
    //Secound Table
    name:'Naziv predmeta',
    mismatchType: 'vrsta',
    mismatchCount: 'preostalo Termina',
  };

  constructor(private teacherService: TeachersService,
              private subjectService: SubjectService,
              private distributionService: DistributionService,
              private formBuilder: FormBuilder,
              private snackBar: MatSnackBar,
              private dialog: MatDialog,
              private schoolYearService: SchoolYearService,
              private appComponent: AppComponent) {
    this.dataSource = new MatTableDataSource<any>();
    this.distributionForm = formBuilder.group({
      teacher: ['',Validators.required],
      subject: ['',Validators.required],
      studyProgram: ['',Validators.required],
      semester: ['',Validators.required],
      countHours: ['',Validators.required],
      sessionCount: ['',Validators.required],
      classType: ['',Validators.required],
    })
  }

  openAddDistributionModal(row: any) {
    this.createNewDistribution = true;
    this.distributionForm.reset();
    this.classTypes = Array.from(new Set(this.distributions.map(distribution => distribution.classType)));

    const modalElement = document.getElementById('distributionModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }

    const fullTeacher = this.teachers.find(teacher => teacher.email === row.email);
    this.distributionForm.patchValue({
      subject: row.name,
      fullTeacher: fullTeacher,
      studyProgram: row.studyProgram,
      semester: row.semester,
      countHours: row.countHours,
      classType: row.classType,
    });
  }

  editDistribution(row: any) {
    if(!this.schoolYearService.isSelectedYearActive()) {
      this.appComponent.openConfirmModal(() => {
        this.openEditDistributionModal(row);
      });
      return;
    } else {
      this.openEditDistributionModal(row);
    }
  }

  openEditDistributionModal(row: any) {
    this.distributionId = row.id;
    this.createNewDistribution = false;
    this.classTypes = Array.from(new Set(this.distributions.map(distribution => distribution.classType)));

    const modalElement = document.getElementById('distributionModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();

      const fullTeacher = this.teachers.find(teacher => teacher.email === row.email);
      this.distributionForm.setValue({
        teacher: fullTeacher,
        subject: row.subject,
        studyProgram: row.studyProgram,
        semester: row.semester,
        countHours: row.countHours,
        sessionCount: row.sessionCount,
        classType: row.classType,
      });
    }
  }

  openDeleteModal(distribution: Distribution): void {
    if(!this.schoolYearService.isSelectedYearActive()) {
      this.appComponent.openConfirmModal(() => {
        this.deleteModal(distribution);
      });
      return;
    } else {
      this.deleteModal(distribution);
    }
  }

  deleteModal(distribution: Distribution): void {
    this.distributionId = distribution.id;
    console.log(distribution);
    this.distributionSubject = ""+distribution.subject;
    const modal = new Modal(document.getElementById('confirmDeleteModal')!);
    modal.show();
  }

  deleteDistribution() {
    this.distributionService.deleteDistribution(this.distributionId).subscribe(
      () => {
        this.distributions = this.distributions.filter(distribution => distribution.id !== this.distributionId);
        this.dataSource.data = this.mapDistributionsToDataSource(this.distributions);
        Modal.getInstance(document.getElementById('confirmDeleteModal')!)?.hide();
        this.snackBar.open('Uspešno ste obrisali raspodelu!', 'Zatvori', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      },
      (error) => {
        this.snackBar.open(`Niste uspeli da obrišete raspodelu. Error: ${error.error.message}`, 'Zatvori', {
          duration: 8000,
          panelClass: ['error-snackbar']
        });
      }
    );
  }


  submitDistribution() {
    if(this.createNewDistribution){
      if(this.distributionForm.valid) {
        const distribution = this.distributionForm.value;
        distribution.teacher = distribution.teacher.email;
        distribution.id =0;

        this.distributionService.saveDistribution(distribution,distribution.studyProgram,distribution.semester).subscribe(
          (savedDistribution) => {
            Modal.getInstance(document.getElementById('distributionModal')!)?.hide();
            this.snackBar.open('Uspešno ste uneli raspodelu!', 'Zatvori', {
              duration: 5000,
              panelClass: ['success-snackbar']
            });
            this.distributions.unshift(savedDistribution);
            this.dataSource.data = this.filterDistributions(this.distributions);
          },
          (error)=> {
            this.snackBar.open(`Niste uspeli da kreirate raspodelu. Error: ${error.error.message}`, 'Zatvori', {
              duration: 8000,
              panelClass: ['error-snackbar']
            });
            //Just to make sure that modal is on top
            const overlayContainer = document.querySelector('.cdk-overlay-container');
            if (overlayContainer) {
              (overlayContainer as HTMLElement).style.zIndex = '1200';
            }
          }
        );
      }
    }else{
      if(this.distributionForm.valid) {
        const distribution = this.distributionForm.value;
        distribution.id = this.distributionId;
        distribution.teacher = distribution.teacher.email;
        this.distributionService.updateDistribution(distribution).subscribe(
          (savedDistribution) => {
            Modal.getInstance(document.getElementById('distributionModal')!)?.hide();
            this.snackBar.open('Uspešno ste izmenili raspodelu!', 'Zatvori', {
              duration: 5000,
              panelClass: ['success-snackbar']
            });
            // Update distribution in the table
            const index = this.distributions.findIndex(tmp => tmp.id === this.distributionId);
            if (index !== -1) {
              this.distributions[index] = savedDistribution;
              this.dataSource.data = this.mapDistributionsToDataSource(this.distributions);
            }
          },
          (error)=> {
            console.log(error)
            this.snackBar.open(`Niste uspeli da izmenite raspodelu. Error: ${error.error.message}`, 'Zatvori', {
              duration: 8000,
              panelClass: ['error-snackbar']
            });
            //Just to make sure that modal is on top
            const overlayContainer = document.querySelector('.cdk-overlay-container');
            if (overlayContainer) {
              (overlayContainer as HTMLElement).style.zIndex = '1200';
            }
          }
        );
      }
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map((tooltipTriggerEl) => new Tooltip(tooltipTriggerEl));
  }

  // ngOnInit(): void {
  //
  //   this.distributionService.getDistributions().subscribe((distributions) => {
  //     this.allDistributions = distributions;
  //     console.log("AllDis:", this.allDistributions)
  //     this.applySemesterFilter();
  //     this.dataSource.data = this.mapDistributionsToDataSource(this.allDistributions);
  //   });
  //   this.displayedColumns = ['teacher','email','subject', 'studyProgram', 'semester', 'countHours','sessionCount' ,'classType','actions'];
  //
  //   this.teacherService.getTeachers().subscribe((teachers) => {
  //     this.teachers = teachers.map(teacher => ({
  //       ...teacher,
  //       fullName: `${teacher.firstName} ${teacher.lastName}`,
  //     }));
  //   });
  //
  //   this.subjectService.getSubjects().subscribe((subjects) =>{
  //     this.subjects = subjects;
  //   } );
  // }

  ngOnInit(): void {
    this.schoolYearService.selectedYear$
      .subscribe((year) => {
        if(!year) return; // ako nije izabrana godina nista ne radimo
        this.selectedYear = year.label
        this.selectedYearId = year.id;

        console.log("Selektovana godina:", this.selectedYear);
        // Dohvatam predmete za izabranu skolsku godinu
        this.distributionService.getDistributionsByYear(year.id).subscribe((distributions) => {
          this.allDistributions = distributions;
          this.applySemesterFilter();
          this.dataSource.data = this.mapDistributionsToDataSource(this.allDistributions);
        })
        this.displayedColumns = ['teacher', 'email', 'subject', 'studyProgram', 'semester', 'countHours','sessionCount' ,'classType','actions'];
      //
        this.teacherService.getTeachersByYear(year.id).subscribe((teachers) => {
          this.teachers = teachers.map(teacher => ({
            ...teacher,
            fullName: `${teacher.firstName} ${teacher.lastName}`,
          }));
        });

        this.subjectService.getSubjectsByYear(year.id).subscribe((subjects) => {
          this.subjects = subjects;
        })
      //
      });


  }


  setSemester(value: "WINTER" | "SUMMER" | "ALL") {
    this.selected = value;


    const semesterFiltered = this.getSemesterFiltered();

    if(this.activeOption === 'first') {
      // this.applySemesterFilter();
      this.dataSource.data = this.mapDistributionsToDataSource(semesterFiltered);
    }

  }

  private getSemesterFiltered(): Distribution[] {
    switch (this.selected) {
      case "WINTER":
        return this.allDistributions.filter(d => d.subject.semester % 2 === 1);
      case "SUMMER":
        return this.allDistributions.filter(d => d.subject.semester % 2 === 0);
      case "ALL":
      default:
        return [...this.allDistributions];
    }
  }


  applySemesterFilter() {

      switch (this.selected) {
        case "WINTER":
          this.distributions = this.allDistributions.filter(distribution => distribution.subject.semester % 2 === 1);
          break;
        case "SUMMER":
          this.distributions = this.allDistributions.filter(distribution => distribution.subject.semester % 2 === 0);
          break;
        case "ALL":
          this.distributions = this.allDistributions;
          break;
    }

  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  mapDistributionsToDataSource(distributions: any[]): any[] {
    return distributions.map((distribution) => {
      return {
        id: distribution.id,
        teacher: distribution.teacher?.firstName + ' ' + distribution.teacher?.lastName,
        studyProgram: distribution.subject?.studyProgram,
        semester: distribution.subject?.semester,
        countHours: distribution.classType === 'vezbe'
          ? distribution.subject?.exerciseHours
          : distribution.subject?.lectureHours,
        leftSessionCount: distribution.classType === 'vezbe'
          ? distribution.subject?.exerciseSessions
          : distribution.subject?.lectureSessions,
        subject: distribution.subject?.name,
        classType: distribution.classType,
        sessionCount: distribution.sessionCount,
        email: distribution.teacher?.email,
      };
    });
  }
  //
  // setFirstActive(): void {
  //   this.activeOption = 'first';
  //   this.selected = "ALL";
  //   this.schoolYearService.selectedYear$
  //     .subscribe((year) => {
  //       if (!year) return; // ako nije izabrana godina nista ne radimo
  //
  //       this.distributionService.getDistributionsByYear(year.id).subscribe((distributions) => {
  //         this.distributions = distributions;
  //         this.dataSource.data = this.mapDistributionsToDataSource(distributions);
  //       })
  //
  //       this.displayedColumns = ['teacher','subject', 'studyProgram', 'semester', 'countHours','sessionCount' ,'classType','actions'];
  //
  //   });
  // }

  applyActiveTabFilter(): void {
    if (this.activeOption === 'second') {
      this.filteredDistributions = this.filterDistributions(this.allDistributions);
    } else {
      this.filteredDistributions = this.mapDistributionsToDataSource(this.allDistributions);
    }

    this.dataSource.data = this.filteredDistributions;
  }


  setFirstActive(): void {
    console.log("Selektovana godina s1:", this.selectedYear)
    this.activeOption = 'first';
    this.displayedColumns = [
      'teacher','subject','studyProgram',
      'semester','countHours','sessionCount',
      'classType','actions'
    ];
    this.applyActiveTabFilter();
  }




  setSecondActive(): void {
    this.activeOption = 'second';
    console.log(this.selectedYear)
    console.log(this.selectedYearId)
    this.distributions = [];  // resetuj prethodne podatke
    this.allDistributions = [];
    this.dataSource.data = [];

    this.distributionService.getDistributionsByYear(this.selectedYearId)
      .subscribe(distributions => {
        this.allDistributions = distributions; // čuvaj u globalnu promenljivu
        this.dataSource.data = this.filterDistributions(distributions);
        console.log("Data:",this.dataSource.data);
      });



    this.displayedColumns = ['name','studyProgram','mismatchType','mismatchCount','actions'];
  }



  // this.distributionService.getDistributions().subscribe(
    //   (distributions) => {
    //     this.dataSource.data = this.filterDistributions(distributions);
    //   },
    //   (error) => {
    //     console.error('Došlo je do greške pri učitavanju distribucija:', error);
    //   }
    // );
    // this.displayedColumns = ['name','studyProgram', 'mismatchType', 'mismatchCount','actions'];
  // }



  getSemesterFilteredDistributions(): Distribution[] {
    switch (this.selected) {
      case 'WINTER':
        return this.allDistributions.filter(
          d => d.subject.semester % 2 === 1
        );

      case 'SUMMER':
        return this.allDistributions.filter(
          d => d.subject.semester % 2 === 0
        );

      case 'ALL':
      default:
        return [...this.allDistributions];
    }
  }



  onSubjectChange(event: Subject): void {
    this.distributionForm.patchValue({
      studyProgram: event?.studyProgram,
      semester: event?.semester,
      countHours: event?.lectureHours,
    });
  }



  filterDistributions(distributions: any[]): any[] {
    const filteredSubjects: any[] = [];

    this.subjectService.getSubjectsByYear(this.selectedYearId).subscribe((subjects) => {
      this.subjects = subjects;
    })

    // Grupisanje distribucija po predmet + tip časa + studijski program
    const grouped = distributions.reduce((acc: any, distribution: any) => {
      const key = `${distribution.subject.name}-${distribution.classType}-${distribution.subject.studyProgram}`;
      if (!acc[key]) {
        acc[key] = {
          subject: distribution.subject.name,
          classType: distribution.classType,
          studyProgram: distribution.subject.studyProgram,
          sessionCount: 0,
          email: distribution.teacher.email
        };
      }
      acc[key].sessionCount += distribution.sessionCount;
      return acc;
    }, {});

    // Provera za svaki predmet da li nedostaju predavanja ili vežbe
    this.subjects.forEach((subject: any) => {
      const lectureExists = distributions.some(
        (distribution: any) =>
          distribution.subject.name === subject.name &&
          distribution.subject.studyProgram === subject.studyProgram &&
          distribution.classType === 'predavanja'
      );

      const exerciseExists = distributions.some(
        (distribution: any) =>
          distribution.subject.name === subject.name &&
          distribution.subject.studyProgram === subject.studyProgram &&
          distribution.classType === 'vezbe'
      );

      if (!lectureExists && subject.lectureSessions > 0) {
        filteredSubjects.push({
          ...subject,
          mismatchType: 'predavanja',
          countHours: subject.lectureHours,
          mismatchCount: subject.lectureSessions,
          classType: 'predavanja',
          email: null
        });
      }

      if (!exerciseExists && subject.exerciseSessions > 0) {
        filteredSubjects.push({
          ...subject,
          mismatchType: 'vezbe',
          countHours: subject.exerciseHours,
          mismatchCount: subject.exerciseSessions,
          classType: 'vezbe',
          email: null
        });
      }
    });

    // Provera da li broj sesija u distribuciji odgovara očekivanom
    for (const key in grouped) {
      const { subject, classType, studyProgram, sessionCount } = grouped[key];

      const matchingSubject = this.subjects.find((sub: any) =>
        sub.name === subject && sub.studyProgram === studyProgram
      );

      if (matchingSubject) {
        const expectedCount =
          classType === 'vezbe' ? matchingSubject.exerciseSessions : matchingSubject.lectureSessions;

        if (sessionCount !== expectedCount) {
          const difference = expectedCount - sessionCount;
          const filteredSubject = {
            ...matchingSubject,
            mismatchType: classType,
            countHours: classType === 'vezbe' ? matchingSubject.exerciseHours : matchingSubject.lectureHours,
            mismatchCount: difference,
            classType: classType,
            email: null
          };
          filteredSubjects.push(filteredSubject);
        }
      }
    }

    console.log('Filtered:', filteredSubjects.map(f => ({
      name: f.name,
      type: f.mismatchType
    })));


    return filteredSubjects;
  }



}
