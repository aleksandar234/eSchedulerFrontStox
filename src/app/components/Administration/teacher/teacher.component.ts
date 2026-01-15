import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {TeachersService} from '../../../services/teacher/teachers.service';
import {Teacher} from '../../../models/teacher.model';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Modal, Tooltip} from 'bootstrap';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {User} from '../../../models/user.model';
import {SchoolYearService} from '../../../services/schoolYear/school-year.service';
import {AppComponent} from '../../../app.component';

@Component({
  selector: 'app-teacher',
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, FormsModule],
  templateUrl: './teacher.component.html',
  standalone: true,
  styleUrl: './teacher.component.css'
})

export class TeacherComponent implements OnInit,AfterViewInit{
  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<any>;
  teacherForm: FormGroup;
  createNewTeacher: boolean = true;
  teachers : Teacher[] = [];
  users: User[] = [];
  teacherId: number = 0;
  teacherName: string = '';
  teacherTitles: Array<string> = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;


  columnNamesMap: { [key: string]: string } = {
    firstName: 'Ime',
    lastName: 'Prezime',
    title: 'Zvanje',
    email: 'Email',
    actions: 'Akcije'
  };

  constructor(private teacherService: TeachersService,
              private formBuilder: FormBuilder,
              private snackBar: MatSnackBar,
              private dialog: MatDialog,
              private schoolYearState: SchoolYearService,
              private appComponent: AppComponent) {
    this.dataSource = new MatTableDataSource<any>();
    this.teacherForm = formBuilder.group({
      firstName: ['',Validators.required],
      lastName: ['',Validators.required],
      title:['',Validators.required],
      email: ['',Validators.required],
      isAdmin: [false,Validators.required],
    })
  }

  openAddTeacherModal() {
    if(!this.schoolYearState.isSelectedYearActive()) {
      this.appComponent.openConfirmModal(() => {
        this.addTeacher();
      });
      return;
    } else {
      this.addTeacher();
    }

  }

  addTeacher() {
    this.createNewTeacher = true;
    this.teacherForm.reset();
    this.teacherTitles = Array.from(new Set(this.teachers.map(teacher => teacher.title)));

    const modalElement = document.getElementById('addTeacherModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }

    this.teacherForm.patchValue({
      email: '@raf.rs',
      isAdmin: false
    });
  }


  editTeacher(teacher: any) {
    if(!this.schoolYearState.isSelectedYearActive()) {
      this.appComponent.openConfirmModal(() => {
        this.openEditTeacherModal(teacher);
      });
      return;
    } else {
      this.openEditTeacherModal(teacher);
    }

  }

  openEditTeacherModal(teacher: any) {
    console.log(teacher);
    this.teacherId = teacher.id;
    this.createNewTeacher = false;
    this.teacherTitles = Array.from(new Set(this.teachers.map(teacher => teacher.title)));

    const modalElement = document.getElementById('addTeacherModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();

      //somethimes is admin and somethimes isAdmin dont know why !!!
      const isAdmin = teacher.admin !== undefined ? teacher.admin : teacher.isAdmin;

      this.teacherForm.setValue({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        title: teacher.title,
        email: teacher.email,
        isAdmin: isAdmin,
      });
    }
  }

  openDeleteModal(teacher: Teacher): void {
    if(!this.schoolYearState.isSelectedYearActive()) {
      this.appComponent.openConfirmModal(() => {
        this.teacherId = teacher.id;
        this.teacherName = teacher.firstName;
        const modal = new Modal(document.getElementById('confirmDeleteModal')!);
        modal.show();
      });
      return;
    } else {
      this.teacherId = teacher.id;
      this.teacherName = teacher.firstName;
      const modal = new Modal(document.getElementById('confirmDeleteModal')!);
      modal.show();
    }

  }

  deleteTeacher() {
    this.teacherService.deleteTeacher(this.teacherId).subscribe(
      () => {
        this.teachers = this.teachers.filter(teacher => teacher.id !== this.teacherId);
        this.dataSource.data = this.teachers;
        Modal.getInstance(document.getElementById('confirmDeleteModal')!)?.hide();
        this.snackBar.open('Uspešno ste obrisali korisnika!', 'Zatvori', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      },
      (error) => {
        this.snackBar.open(`Niste uspeli da obrišete korisnika. Error: ${error.error.message}`, 'Zatvori', {
          duration: 8000,
          panelClass: ['error-snackbar']
        });
      }
    );
  }


  submitTeacher() {
    if(this.createNewTeacher){
      if(this.teacherForm.valid) {
        const teacher = this.teacherForm.value;
        this.teacherService.saveTeacher(teacher).subscribe(
          (savedTeacher) => {
            Modal.getInstance(document.getElementById('addTeacherModal')!)?.hide();
            this.snackBar.open('Uspešno ste uneli korisnika!', 'Zatvori', {
              duration: 5000,
              panelClass: ['success-snackbar']
            });
              this.teachers.unshift(savedTeacher);
              this.dataSource.data = this.teachers;

          },
          (error)=> {
            this.snackBar.open(`Niste uspeli da kreirate korisnika. Error: ${error.error.message}`, 'Zatvori', {
              duration: 8000,
              panelClass: ['error-snackbar']
            });
          }
        );
      }
    }else{
      if(this.teacherForm.valid) {
        const teacher = this.teacherForm.value;
        teacher.id = this.teacherId;
        this.teacherService.updateTeacher(teacher).subscribe(
          () => {
            Modal.getInstance(document.getElementById('addTeacherModal')!)?.hide();
            this.snackBar.open('Uspešno ste izmenili korisnika!', 'Zatvori', {
              duration: 5000,
              panelClass: ['success-snackbar']
            });
            // Update teacher in the table
            const index = this.teachers.findIndex(tmp => tmp.id === this.teacherId);
            if (index !== -1) {
              this.teachers[index] = teacher;
              this.dataSource.data = this.teachers;
            }
          },
          (error)=> {
            this.snackBar.open(`Niste uspeli da izmenite korisnika. Error: ${error.error.message}`, 'Zatvori', {
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
  //   this.teacherService.getTeachers().subscribe((teachers) => {
  //     this.teachers = teachers;
  //     this.dataSource.data = this.teachers;
  //   });
  //   this.displayedColumns = ['firstName', 'lastName', 'title','email','actions'];
  //
  //   this.teacherForm.get('firstName')?.valueChanges.subscribe(() => {
  //     if (this.createNewTeacher) {
  //       this.updateEmail();
  //     }
  //   });
  //
  //   this.teacherForm.get('lastName')?.valueChanges.subscribe(() => {
  //     if (this.createNewTeacher) {
  //       this.updateEmail();
  //     }
  //   });
  // }

  ngOnInit() {
    this.schoolYearState.selectedYear$
      .subscribe((year) => {
        if(!year) return; // Ako nije izabrana godina nista ne radimo

        // Dohvatam profesore za izabranu godinu
        this.teacherService.getTeachersByYear(year.id).subscribe((teachers) => {
          this.teachers = teachers;
          this.dataSource.data = this.teachers;
        })

        this.displayedColumns = ['firstName', 'lastName', 'title', 'email', 'actions'];

        this.teacherForm.get('firstName')?.valueChanges.subscribe(() => {
          if(this.createNewTeacher) {
            this.updateEmail()
          }
        });

        this.teacherForm.get('lastName')?.valueChanges.subscribe(() => {
          if(this.createNewTeacher) {
            this.updateEmail();
          }
        })

      })
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  updateEmail(): void {
    const firstName = this.teacherForm.get('firstName')?.value || '';
    const lastName = this.teacherForm.get('lastName')?.value || '';
    const email = `${firstName[0]?.toLowerCase() || ''}${lastName?.toLowerCase() || ''}@raf.rs`;
    this.teacherForm.patchValue({ email });
  }

}
