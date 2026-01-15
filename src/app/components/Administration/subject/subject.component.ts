import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {
  MatColumnDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatTable,
  MatTableDataSource,
  MatTableModule
} from '@angular/material/table';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Teacher} from '../../../models/teacher.model';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {TeachersService} from '../../../services/teacher/teachers.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {Modal, Tooltip} from 'bootstrap';
import {MatFormField, MatFormFieldModule} from '@angular/material/form-field';
import {CommonModule} from '@angular/common';
import {MatSortModule} from '@angular/material/sort';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {SubjectService} from '../../../services/subject/subject.service';
import {Subject} from '../../../models/subject.model';
import {SchoolYearService} from '../../../services/schoolYear/school-year.service';
import {AppComponent} from '../../../app.component';

@Component({
  selector: 'app-subject',
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, FormsModule],
  templateUrl: './subject.component.html',
  standalone: true,
  styleUrl: './subject.component.css'
})
export class SubjectComponent implements OnInit,AfterViewInit{

  charMap: Record<string, string[]> = {
    'c': ['c', 'č', 'ć'],
    's': ['s', 'š'],
    'z': ['z', 'ž']
  };

  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<any>;
  subjectForm: FormGroup;
  createNewSubject: boolean = true;
  subjects : Subject[] = [];
  subjectId: number = 0;
  subjectName: string = '';
  //for dropdown
  studyPrograms: Array<string> = [];
  useStudyProgramDropdown: boolean = false;
  mandatory: Array<string> = [];
  isActive: boolean = false;
  allSubjectsFromBack: Subject[] = [];
  selected: "WINTER" | "SUMMER" | "ALL" = "ALL";

  @ViewChild(MatPaginator) paginator!: MatPaginator;


  columnNamesMap: { [key: string]: string } = {
    name: 'Naziv predmeta',
    studyProgram: 'Studijski program',
    semester: 'Semestar',
    lectureHours: 'Broj časova predavanja',
    exerciseHours: 'Broj časova vežbi',
    practicumHours: 'Broj časova praktikuma',
    mandatory: 'Obavezni',
    lectureSessions: 'Broj predavanja',
    exerciseSessions: 'Broj vežbi',
    actions: 'Akcije'
  };

  constructor(private subjectService: SubjectService,
              private formBuilder: FormBuilder,
              private snackBar: MatSnackBar,
              private dialog: MatDialog,
              private schoolYearState: SchoolYearService,
              private appComponet: AppComponent) {
    this.dataSource = new MatTableDataSource<any>();
    this.subjectForm = formBuilder.group({
      name: ['',Validators.required],
      studyProgram: ['',Validators.required],
      semester: ['',Validators.required],
      lectureHours: ['',Validators.required],
      exerciseHours: ['',Validators.required],
      practicumHours: [''],
      mandatory: ['',Validators.required],
      lectureSessions: ['',Validators.required],
      exerciseSessions: ['',Validators.required]
    })
  }




  openAddSubjectModal() {
    if(!this.schoolYearState.isSelectedYearActive()) {
      this.appComponet.openConfirmModal(() => {
        this.addSubject();
      });
      return;
    } else {
      this.addSubject();
    }
  }

  addSubject() {
    this.createNewSubject = true;
    this.subjectForm.reset();
    this.studyPrograms = Array.from(new Set(this.subjects.map(subject => subject.studyProgram))).sort((a, b) => a.length - b.length);;
    this.mandatory = Array.from(new Set(this.subjects.map(subject => subject.mandatory)));

    const modalElement = document.getElementById('addSubjectModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  editSubject(subject: any) {
    if(!this.schoolYearState.isSelectedYearActive()) {
      this.appComponet.openConfirmModal(() => {
        this.openEditSubjectModal(subject);
      });
      return;
    } else {
      this.openEditSubjectModal(subject);
    }
  }

  openEditSubjectModal(subject: any) {
    this.subjectId = subject.id;
    this.createNewSubject = false;
    this.studyPrograms = Array.from(new Set(this.subjects.map(subject => subject.studyProgram))).sort((a, b) => a.length - b.length);
    this.mandatory = Array.from(new Set(this.subjects.map(subject => subject.mandatory)));

    const modalElement = document.getElementById('addSubjectModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();

      this.subjectForm.setValue({
        name: subject.name,
        studyProgram: subject.studyProgram,
        semester: subject.semester,
        lectureHours: subject.lectureHours,
        exerciseHours: subject.exerciseHours,
        practicumHours: subject.practicumHours,
        mandatory: subject.mandatory,
        lectureSessions: subject.lectureSessions,
        exerciseSessions: subject.exerciseSessions
      });
    }
  }

  openDeleteModal(subject: Subject): void {

    if(!this.schoolYearState.isSelectedYearActive()) {
      this.appComponet.openConfirmModal(() => {
        this.subjectId = subject.id;
        this.subjectName = subject.name;
        const modal = new Modal(document.getElementById('confirmDeleteModal')!);
        modal.show();
      });
      return;
    } else {
      this.subjectId = subject.id;
      this.subjectName = subject.name;
      const modal = new Modal(document.getElementById('confirmDeleteModal')!);
      modal.show();
    }

  }

  deleteSubject() {
    this.subjectService.deleteSubject(this.subjectId).subscribe(
      () => {
        this.subjects = this.subjects.filter(subject => subject.id !== this.subjectId);
        this.dataSource.data = this.subjects;
        Modal.getInstance(document.getElementById('confirmDeleteModal')!)?.hide();
        this.snackBar.open('Uspešno ste obrisali predmet!', 'Zatvori', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      },
      (error) => {
        this.snackBar.open(`Niste uspeli da obrišete predmet. Error: ${error.error.message}`, 'Zatvori', {
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


  submitSubject() {
    if(this.createNewSubject){
      if(this.subjectForm.valid) {
        const subject = this.subjectForm.value;
        this.subjectService.saveSubject(subject).subscribe(
          (savedSubject) => {
            Modal.getInstance(document.getElementById('addSubjectModal')!)?.hide();
            this.snackBar.open('Uspešno ste uneli novi predmet!', 'Zatvori', {
              duration: 5000,
              panelClass: ['success-snackbar']
            });
            // Update teacher in the table
            console.log(savedSubject);
            this.subjects.unshift(savedSubject);
            this.dataSource.data = this.subjects;

          },
          (error)=> {
            this.snackBar.open(`Niste uspeli da kreirate predmet. Error: ${error.error.message}`, 'Zatvori', {
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
      console.log("ZISOV");
      if(this.subjectForm.valid) {
        console.log("ZISOV HLBOKO");
        const subject = this.subjectForm.value;
        subject.id = this.subjectId;
        this.subjectService.updateSubject(subject).subscribe(
          () => {
            Modal.getInstance(document.getElementById('addSubjectModal')!)?.hide();
            this.snackBar.open('Uspešno ste izmenili predmet!', 'Zatvori', {
              duration: 5000,
              panelClass: ['success-snackbar']
            });
            // Update teacher in the table
            const index = this.subjects.findIndex(tmp => tmp.id === this.subjectId);
            if (index !== -1) {
              this.subjects[index] = subject;
              this.dataSource.data = this.subjects;
            }
          },
          (error)=> {
            this.snackBar.open(`Niste uspeli da izmenite predmet. Error: ${error.message}`, 'Zatvori', {
              duration: 8000,
              panelClass: ['error-snackbar']
            });
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
  //   this.subjectService.getSubjects().subscribe(
  //     (subjects) => {
  //       this.allSubjectsFromBack = subjects;
  //       this.subjects = subjects;
  //       this.applySemesterFilter(subjects);
  //       this.dataSource.data = this.subjects;
  //     });
  //   this.displayedColumns = ['name', 'studyProgram', 'semester','lectureHours','exerciseHours','practicumHours','mandatory','lectureSessions','exerciseSessions','actions'];
  // }


  ngOnInit(): void {
    this.schoolYearState.selectedYear$
      .subscribe((year) => {
        if(!year) return; // ako nije izabrana godina nista ne radimo

        // Dohvatam predmete za izabranu skolsku godinu
        this.subjectService.getSubjectsByYear(year.id).subscribe(
          (subjects) => {
            this.allSubjectsFromBack = subjects;
            this.subjects = subjects;
            this.applySemesterFilter(subjects);
            this.dataSource.data = this.subjects;
          }
        );
      });

    this.displayedColumns = ['name', 'studyProgram', 'semester', 'lectureHours', 'exerciseHours','practicumHours','mandatory','lectureSessions','exerciseSessions','actions']
  }

  setSemester(value: "WINTER" | "SUMMER" | "ALL") {
    this.selected = value;
    this.applySemesterFilter(this.allSubjectsFromBack);
    this.dataSource.data = this.subjects;
  }


  applySemesterFilter(subjects: Subject[]): void {
    switch (this.selected) {
      case "WINTER":
        this.subjects = subjects.filter(s => s.semester % 2 === 1);
        break;
      case "SUMMER":
        this.subjects = subjects.filter(s => s.semester % 2 === 0);
        break;
      case "ALL":
        this.subjects = subjects;
        break;
    }
  }

  mapChar(char: string): string[] {
    char = char.toLowerCase();
    return this.charMap[char] || [char];
  }

  buildSearchRegex(str: string): RegExp {
    const pattern = str
      .split('')
      .map(c => this.mapChar(c).join('')) // napravi [cčć] za svako slovo
      .map(chars => `[${chars}]`)     // regex pattern za jedno slovo
      .join('');
    return new RegExp(pattern, 'i');  // i → case insensitive
  }



  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim();

    // napravi regex
    const regex = this.buildSearchRegex(filterValue);

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      return Object.keys(data).some(key => regex.test(data[key]));
    };

    this.dataSource.filter = filterValue; // obavezno dodeljuj nešto, Angular trigeruje filter
  }

  changeVisibilityStudyProgram(){
    this.useStudyProgramDropdown = !this.useStudyProgramDropdown;
  }

}
