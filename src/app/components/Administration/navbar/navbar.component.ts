import {Component, OnInit} from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {AuthService} from '../../../services/auth.service';
import pdfMake from 'pdfmake/build/pdfmake';
import {TeacherSummary} from '../../../models/teacherSummary.model';
import {Subject} from '../../../models/subject.model';
import {Teacher} from '../../../models/teacher.model';
import {Distribution} from '../../../models/distribution.model';
import {TeachersService} from '../../../services/teacher/teachers.service';
import {SubjectService} from '../../../services/subject/subject.service';
import {DistributionService} from '../../../services/distribution/distribution.service';
import {SchoolYearService} from '../../../services/schoolYear/school-year.service';
import {SchoolYear} from '../../../models/schoolYear.model';
import {CommonModule} from '@angular/common';
import * as bootstrap from 'bootstrap';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Modal} from 'bootstrap';
import {MatSnackBar} from '@angular/material/snack-bar';


@Component({
  selector: 'app-navbar',
  imports: [RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './navbar.component.html',
  standalone: true,
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit{

  teachers: Teacher[] = [];
  subjects: Subject[] = [];
  distributions: Distribution[] = [];
  teacherSummary: TeacherSummary[] = [];
  activeYear: string = "";
  schoolYears: SchoolYear[] = [];
  createNewSchoolYear: boolean = false;
  schoolYearForm: FormGroup;
  selectedYear: SchoolYear | null = null;

  constructor(
    private authService: AuthService,
    private teacherService: TeachersService,
    private subjectService: SubjectService,
    private distributionService: DistributionService,
    private schoolYearService: SchoolYearService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.schoolYearForm = this.fb.group({
      // oznaka npr. "2025/2026"
      label: ['', [Validators.required, Validators.pattern(/^\d{4}\/\d{4}$/)]],

      // datum početka
      startDate: ['', Validators.required],

      // datum završetka
      endDate: ['', Validators.required],

      // checkbox za aktivnu godinu
      active: [false],

      // forma za biracnje kopiranja godine
      copyFromYear: [null]
    });

  }

  closeModal() {
    const modalEl = document.getElementById('schoolYearModal');
    if(modalEl) {
      const modal = Modal.getInstance(modalEl);
      modal?.hide();
    }
  }

  ngOnInit(): void {

    this.schoolYearService.selectedYear$.subscribe(year => {
      if (year) {
        this.activeYear = year.label; // npr. "2025/2026"
      }
    });

    this.teacherService.getTeachers().subscribe((teachers) => {
      this.teachers = teachers;
      this.teacherSummary = this.teachers.map((teachers)=>({
        id: teachers.id,
        email: teachers.email,
        firstName: teachers.firstName,
        lastName: teachers.lastName,
        title: teachers.title,
        summaryExerciseHours: 0,
        summaryLectureHours: 0,
      }))
        .sort((a, b) => {
          const lastNameComparison = a.lastName.localeCompare(b.lastName);
          return lastNameComparison !== 0 ? lastNameComparison : a.firstName.localeCompare(b.firstName);
        });
    });

    this.subjectService.getSubjects().subscribe((subjects) => {
      this.subjects = subjects.sort((a,b) =>{
        if(a.semester !== b.semester){
          return a.semester - b.semester;
        }
        return a.studyProgram.localeCompare(b.studyProgram);
      });
      this.subjects = subjects;
    });

    this.distributionService.getDistributions().subscribe((distributions) => {
      this.distributions = distributions;

      this.distributions.forEach((distribution) => {
        const index = this.teacherSummary.findIndex(
          (ts) => ts.id === distribution.teacher.id
        );

        if (index !== -1) {
          if (distribution.classType === 'vezbe') {
            this.teacherSummary[index].summaryExerciseHours += (distribution.subject.exerciseHours *13* distribution.sessionCount);
          } else {
            this.teacherSummary[index].summaryLectureHours += (distribution.subject.lectureHours *13* distribution.sessionCount);
          }
        }
      });
    });

    this.schoolYearService.getActiveSchoolYear().subscribe({
      next: (data) => {
        this.activeYear = data.oznaka
        console.log("AC:", data)
      },
      error: (err) => {
        console.error("Greska pri učitavanju aktivne godine", err);
      }
    })

    this.schoolYearService.getAllSchoolYears().subscribe({
      next: (data) => {
        this.schoolYears = data;
        this.schoolYears.sort((a, b) => {
          const yearA = parseInt(a.label.split('/')[0], 10);
          const yearB = parseInt(b.label.split('/')[0], 10);
          return yearB - yearA; // najveća godina gore
        });
        console.log("SY:", this.schoolYears)
        const activeYear = this.schoolYears.find(year => year.label === this.activeYear)
        if (activeYear) {
          // TypeScript sada zna da activeYear nije undefined
          this.selectSchoolYear(activeYear);
        } else {
          // fallback ako nije pronađena odgovarajuća godina
          if (this.schoolYears.length > 0) {
            this.selectSchoolYear(this.schoolYears[0]);
          }
        }
      },
      error: (err) => {
        console.error("Greska pri učitavanju aktivne godine", err);
      }
    })



  }

  retrieveActiveSchoolYear() {
    this.schoolYearService.getActiveSchoolYear().subscribe({
      next: (data) => {
        this.activeYear = data.oznaka
        console.log("AC:", data)
      },
      error: (err) => {
        console.error("Greska pri učitavanju aktivne godine", err);
      }
    })
  }


  onLogout(): void {
    this.authService.logout();
  }


  exportData(type: 'teachers' | 'subjects' | 'distributions', format: 'json' | 'pdf') {
    if (format === 'json') {
      this.exportDataToJson(type)
    } else if (format === 'pdf') {
      this.exportDataToPdf(type)
    }
  }

  exportDataToJson(type: 'teachers' | 'subjects' | 'distributions'): void {
    let data;
    let fileName = '';

    switch (type) {
      case 'teachers':
        data = this.teachers;
        fileName = 'nastavnici.json';
        break;
      case 'subjects':
        data = this.subjects;
        fileName = 'predmeti.json';
        break;
      case 'distributions':
        data = this.distributions;
        fileName = 'raspodela.json';
        break;
    }

    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  exportDataToPdf(type: 'teachers' | 'subjects' | 'distributions'): void {
    let data: any[];
    let fileName = '';
    let naslov = '';

    switch (type) {
      case 'teachers':
        data = this.teacherSummary;
        fileName = 'nastavnici.pdf';
        naslov = 'Izveštaj - Profesori';
        break;
      case 'subjects':
        data = this.subjects;
        fileName = 'predmeti.pdf';
        naslov = 'Izveštaj - Predmeti';
        break;
      case 'distributions':
        data = this.distributions;
        fileName = 'raspodela.pdf';
        naslov = 'Izveštaj - Raspodela';
        break;
      default:
        console.warn(`Nepoznat tip podataka: ${type}`);
        return;
    }

    if (!data || data.length === 0) {
      console.warn(`Nema podataka za ${type}`);
      return;
    }

    const docDefinition = {
      content: [
        {text: naslov, style: 'header'},
        ...this.generateContentForPdf(type, data)
      ],
      styles: {
        header: {
          fontSize: 8,
          bold: true,
          alignment: 'center' as const,
          margin: [0, 0, 0, 2] as [number, number, number, number]
        },
        subheader: {
          fontSize: 8,
          bold: true,
          margin: [0, 2, 0, 2] as [number, number, number, number]
        },
        tableHeader: {
          bold: true,
          fontSize: 6,
          color: 'white',
          fillColor: '#2980b9',
          alignment: 'center' as const,
          margin: [0, 0, 0, 0] as [number, number, number, number]
        }
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 6
      },
      fonts: {
        Roboto: {
          normal: 'Roboto-Regular.ttf',
          bold: 'Roboto-Medium.ttf',
          italics: 'Roboto-Italic.ttf',
          bolditalics: 'Roboto-MediumItalic.ttf'
        }
      }
    };

    pdfMake.createPdf(docDefinition).download(fileName);
  }

  generateContentForPdf(type: string, data: any[]): any[] {
    const content: any[] = [];

    if (type === 'teachers') {
      data.forEach((teacherSummary: TeacherSummary) => {
        const teacher = this.teachers.find(t => t.id === teacherSummary.id);

        content.push(
          {
            text: `${teacherSummary.lastName} ${teacherSummary.firstName} - ${teacher?.title || 'N/A'}`,
            style: 'subheader',
            margin:[0,2,0,2]
          },
          {
            text: `Fond časova: ${teacherSummary.summaryLectureHours + teacherSummary.summaryExerciseHours}`,
            alignment: 'right',
            margin: [0, -10, 0, 2]
          }
        );

        const teacherDistributions = this.distributions.filter(dist => dist.teacher.id === teacherSummary.id);
        const tableData = teacherDistributions.map(dist => [
          dist.subject.name,
          dist.subject.studyProgram,
          dist.subject.semester,
          dist.classType === 'vezbe' ? 'Vežbe' : 'Predavanja',
          dist.classType === 'vezbe' ? dist.subject.exerciseHours : dist.subject.lectureHours,
          dist.sessionCount,
          (dist.classType === 'vezbe' ? dist.subject.exerciseHours : dist.subject.lectureHours) * 13 * dist.sessionCount
        ]);

        content.push({
          table: {
            headerRows: 1,
            widths: ['30%', '20%', '10%', '10%', '10%', '10%', '10%'],
            body: [
              [
                {text: 'Naziv', style: 'tableHeader'},
                {text: 'Stud. program', style: 'tableHeader'},
                {text: 'Semestar', style: 'tableHeader'},
                {text: 'Vrsta', style: 'tableHeader'},
                {text: 'Fond', style: 'tableHeader'},
                {text: 'Termini', style: 'tableHeader'},
                {text: 'Ukupno', style: 'tableHeader'}
              ],
              ...tableData
            ]
          },
          margin: [0, 0, 0, 5]
        });
      });
    } else if (type === 'subjects') {
      data.forEach((subject: Subject) => {
        content.push(
          {text: `${subject.name} - ${subject.studyProgram}, semestar: ${subject.semester}, Termini Predavanja: ${subject.lectureSessions}, Termini Vežbi: ${subject.exerciseSessions}`,
            style: 'subheader',
            margin:[0,0,0,5]
          });

        const subjectDistributions = this.distributions.filter(dist => dist.subject.id === subject.id);
        const tableData = subjectDistributions.map(dist => [
          `${dist.teacher.lastName} ${dist.teacher.firstName}`,
          dist.classType === 'vezbe' ? 'Vežbe' : 'Predavanja',
          dist.sessionCount,
          dist.classType === 'vezbe' ? dist.subject.exerciseHours : dist.subject.lectureHours,
          (dist.classType === 'vezbe' ? dist.subject.exerciseHours : dist.subject.lectureHours) * 13 * dist.sessionCount
        ]);

        content.push({
          table: {
            headerRows: 1,
            widths: ['30%', '15%', '20%', '20%', '15%'],
            body: [
              [
                {text: 'Nastavnik', style: 'tableHeader'},
                {text: 'Vrsta', style: 'tableHeader'},
                {text: 'Broj termina', style: 'tableHeader'},
                {text: 'Broj časova', style: 'tableHeader'},
                {text: 'Ukupno', style: 'tableHeader'}
              ],
              ...tableData
            ]
          },
          margin: [0, 0, 0, 5]
        });
      });
    } else if (type === 'distributions') {
      // console.log('Implementacija za distribucije će biti dodata kasnije.');
    }

    return content;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        this.distributionService.importDistributions(json).subscribe({
          next: (_response) => {
            // Ako je server odgovorio sa plain tekstom i statusom 201, ovo će se ovde obraditi
            location.reload();
          },
          error: (err) => {
            // Ako status NIJE 201, obradi grešku
            console.error(err);
            alert('Greška prilikom slanja na backend!');
          }
        });
      } catch (e) {
        alert('Greška prilikom čitanja JSON fajla!');
      }
    };

    reader.readAsText(file);
  }


  selectSchoolYear(year: SchoolYear) {
    this.schoolYearService.setYear(year);
  }

  isActiveYear(): boolean {
    if (!this.schoolYears || !this.activeYear) return false;
    const active = this.schoolYears.find(y => y.label === this.activeYear);
    return active ? active.active : false;
  }

  openCreateSchoolYear() {
      this.createNewSchoolYear = true;
      this.schoolYearForm.reset({
        label: '',
        startDate: '',
        endDate: '',
        active: false,
        copyFromYear: null
      });

      const modal = new bootstrap.Modal(document.getElementById('schoolYearModal')!);
      modal.show();
  }

  submitSchoolYear() {
    const formData = this.schoolYearForm.value;
    console.log("FormData:", formData);
    if(this.schoolYearForm.invalid) {
      this.schoolYearForm.markAllAsTouched();
      return;
    }

    // Pravim svoj model
    const newSchoolYear = {
      label: formData.label,
      startDate: formData.startDate,
      endDate: formData.endDate,
      active: formData.active,
      copyFromYear: formData.copyFromYear
    }

    console.log("NewSchoolYear:", newSchoolYear);

    // Proveravamo sta dalje da radimo na osnovu godine koju su uneli ili nisu
    if(newSchoolYear.copyFromYear === null) {
      // Ovo znaci da je korisnik uneo da zeli da napravi praznu skolsku godinu
      this.createEmptySchoolYear(newSchoolYear);
    } else {
      // Ovo znaci da korisnik zeli da prekopira neku od prethodnih godina
      this.copyPreviousSchoolYear(newSchoolYear);
    }


  }

  copyPreviousSchoolYear(formData: any) {
    const targetYear = {
      id: null,
      oznaka: formData.label,
      datum_pocetka: formData.startDate,
      datum_zavrsetka: formData.endDate,
      aktivna: formData.active
    }

    const sourceYearId = formData.copyFromYear;
    this.schoolYearService.createCopiedSchoolYear(targetYear, sourceYearId).subscribe({
      next: (res) => {
        console.log("Skolska godina kreirana:", res);

        this.closeModal();

        this.snackBar.open('Uspešno ste kreirali godinu!', 'Zatvori', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });

        // this.retrieveActiveSchoolYear();

        window.location.reload();

      },
      error: () => {
      console.error('Greska prilikom kreiranja godine')
    }
    })

  }

  createEmptySchoolYear(formData: any) {

    // Ovde pravim novu godinu bez coyParametra, jer znam da mi je null, zato sam i usao u pravljenje prazne skolske godine
    const newYear = {
      oznaka: formData.label,
      datum_pocetka: formData.startDate,
      datum_zavrsetka: formData.endDate,
      aktivna: formData.active
    }

    this.schoolYearService.createEmptySchoolYear(newYear).subscribe({
      next: (res) => {
        console.log('Skolska godina kreirana:', res);

        this.closeModal();

        this.snackBar.open('Uspešno ste kreirali godinu!', 'Zatvori', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });

        // this.retrieveActiveSchoolYear();

        window.location.reload();
      },
        error: () => {
        console.error('Greska prilikom kreiranja godine')
      }


    });

  }


}
