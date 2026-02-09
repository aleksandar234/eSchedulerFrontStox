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
import {firstValueFrom} from 'rxjs';
import {MasterClass} from '../../../models/masterClass.model';
import {MasterDoctoralClasses} from '../../../models/masterDoctoralClasses.model';
import {MasterClassService} from '../../../services/masterClass/master-class.service';
import {MentorCommissionModel} from '../../../models/mentorCommission.model';


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
  masterDoctoralClasses: MasterDoctoralClasses[] = [];
  mentorCommission: MentorCommissionModel[] = [];
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
    private masterClassService: MasterClassService,
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


  exportData(type: 'teachers' | 'subjects' | 'distributions' | 'masterDoctoralClasses' | 'mentorCommission', format: 'json' | 'pdf') {
    if (format === 'json') {
      this.exportDataToJson(type)
    } else if (format === 'pdf') {
      this.exportDataToPdf(type)
    }
  }

  async loadAllDistributionsSubjectsTeachers(selectedYearId: number){

    this.distributions = await firstValueFrom(
      this.distributionService.getDistributionsByYear(selectedYearId)
    );

    this.subjects = await firstValueFrom(
      this.subjectService.getSubjectsByYear(selectedYearId)
    );

    this.teachers = await firstValueFrom(
      this.teacherService.getTeachersByYear(selectedYearId)
    );

    this.masterDoctoralClasses = await firstValueFrom(
      this.masterClassService.getMasterDoctoralClassesByYear(selectedYearId)
    )

    this.mentorCommission = await firstValueFrom(
      this.masterClassService.getMentorCommissionForSY(selectedYearId)
    )


  }


  async exportDataToJson(type: 'teachers' | 'subjects' | 'distributions' | 'masterDoctoralClasses' | 'mentorCommission'): Promise<void> {

    let currentYear = this.schoolYearService.getCurrentYear();

    await this.loadAllDistributionsSubjectsTeachers(currentYear!.id)

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


  async exportDataToPdf(type: 'teachers' | 'subjects' | 'distributions' | 'masterDoctoralClasses' | 'mentorCommission'): Promise<void> {

    let currentYear = this.schoolYearService.getCurrentYear();

    await this.loadAllDistributionsSubjectsTeachers(currentYear!.id);

    let data: any[];
    let fileName = '';
    let naslov = '';

    console.log("Ovo mi je trenutno selektovana godina kada kliknem akciju export:", currentYear);

    console.log("Nastavnici:", this.teachers);
    console.log("Predmeti:", this.subjects);
    console.log("Raspodle:", this.distributions);
    console.log("MasterDoktoski casovi:", this.masterDoctoralClasses)
    console.log("Komisija/Mentorstvo:", this.mentorCommission);


    switch (type) {
      case 'teachers':
        data = this.teachers;
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
      case 'masterDoctoralClasses':
        data = this.masterDoctoralClasses;
        fileName = 'postakademske.pdf';
        naslov = "Izvestaj - Postakademske";
        break;
      case 'mentorCommission':
        data = this.mentorCommission;
        fileName = 'mentorKomisija.pdf';
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

  consoleLogAfterLoad() {
    console.log("Ovo mi je sada konacna raspodela:", this.distributions);
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
    } else if (type === 'masterDoctoralClasses') {
      // 1️⃣ Grupisanje po nastavniku
      const nastavnikIds = Array.from(new Set(data.map(d => d.nastavnkId)));

      nastavnikIds.forEach(nastavnkId => {
        const classesByTeacher = data.filter(d => d.nastavnkId === nastavnkId);

        const teacher = this.teachers.find(t => t.id === nastavnkId);

        // Subheader sa nastavnikom (ako imaš ime, stavi ime, ovde ID)
        content.push({
          text: `${teacher?.firstName || 'N/A'} ${teacher?.lastName || ''} - ${teacher?.title || ''}`,
          style: 'subheader',
          margin: [0, 2, 0, 2]
        });

        // Tabela sa svim predmetima (master + doktorat)
        const tableData = classesByTeacher.map(d => [
          d.predmetNaPostakademskimStudijama || 'N/A',
          d.stepenStudija || 'N/A',
          d.odrzanoCasova ?? 'N/A',
          d.datumOdrzavanjaCasova || 'N/A',
          d.datumUnosa ? new Date(d.datumUnosa).toLocaleDateString() : 'N/A',
          d.napomena || ''
        ]);

        content.push({
          table: {
            headerRows: 1,
            widths: ['30%', '15%', '10%', '15%', '20%', '10%'],
            body: [
              ['Predmet', 'Stepen Studija', 'Održano časova', 'Datum održavanja', 'Datum unosa', 'Napomena'],
              ...tableData
            ]
          },
          margin: [0, 0, 0, 5]
        });
      });
    } else if (type === 'mentorCommission') {

      content.push({
        text: 'Izveštaj - Komisija i Mentorstvo',
        style: 'header',
        margin: [0, 0, 0, 5]
      });


      const tableData: any[] = (data || []).map(d => [
        d.tip_angazmana || 'N/A',
        d.stepenStudija || 'N/A',
        d.imeStudenta || 'N/A',
        d.temaRada || 'N/A',
        d.napomena || '',
        d.datumUnosa ? new Date(d.datumUnosa).toLocaleString() : 'N/A'
      ]);



      content.push({
        table: {
          headerRows: 1,
          widths: ['15%', '15%', '20%', '20%', '20%', '10%'],
          body: [
            ['Tip angažmana', 'Stepen studija', 'Ime studenta', 'Tema rada', 'Napomena', 'Datum unosa'],
            ...tableData
          ]
        },
        margin: [0, 0, 0, 5]
      });
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


  pendingNewYearData: any | null = null;
  formData: any | null = null;

  submitSchoolYear() {
    this.formData = this.schoolYearForm.value;
    console.log("FormData:", this.formData);

    if (this.schoolYearForm.invalid) {
      this.schoolYearForm.markAllAsTouched();
      return;
    }

    // neutralni objekat sa podacima iz forme
    const newYearData = {
      label: this.formData.label,
      startDate: this.formData.startDate,
      endDate: this.formData.endDate,
      active: this.formData.active,
      copyFromYear: this.formData.copyFromYear
    };

    console.log("NewYearData:", newYearData);

    // Ako je broj godina >= 4, otvorimo modal i prosledimo podatke direktno
    if (this.schoolYears.length >= 4) {
      console.log("usao sam ovde za otvaranje modala");
      this.pendingNewYearData = newYearData; // čuvamo podatke u komponenti
      this.openExportRemoveModal(newYearData.label); // prosleđujemo podatke u modal
      return;
    }


    // Ako je manje od 4 godine, pravimo novu školsku godinu
    // if (!formData.copyFromYear) {
    //   this.createEmptySchoolYear({
    //     id_skolska_godina: 0,
    //     oznaka: formData.label,
    //     datum_pocetka: formData.startDate,
    //     datum_zavrsetka: formData.endDate,
    //     aktivna: formData.active
    //   });
    // } else {
    //   this.copyPreviousSchoolYear({
    //     id_skolska_godina: null,
    //     oznaka: formData.label,
    //     datum_pocetka: formData.startDate,
    //     datum_zavrsetka: formData.endDate,
    //     aktivna: formData.active,
    //     copyFromYear: formData.copyFromYear
    //   });
    // }

    this.createNewYear(this.formData);


  }

  createNewYear(newYearData: any) {

    console.log("Creating new year with data:", newYearData);

    if (!newYearData.copyFromYear) {
      this.createEmptySchoolYear({
        id_skolska_godina: 0,
        oznaka: newYearData.label,
        datum_pocetka: newYearData.startDate,
        datum_zavrsetka: newYearData.endDate,
        aktivna: newYearData.active
      });
    } else {
      this.copyPreviousSchoolYear({
        id_skolska_godina: null,
        oznaka: newYearData.label,
        datum_pocetka: newYearData.startDate,
        datum_zavrsetka: newYearData.endDate,
        aktivna: newYearData.active,
        copyFromYear: newYearData.copyFromYear
      });
    }
  }



  copyPreviousSchoolYear(formData: any) {
    const targetYear = {
      id: null,
      oznaka: formData.oznaka,
      datum_pocetka: formData.datum_pocetka,
      datum_zavrsetka: formData.datum_zavrsetka,
      aktivna: formData.aktivna
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
      oznaka: formData.oznaka,
      datum_pocetka: formData.datum_pocetka,
      datum_zavrsetka: formData.datum_zavrsetka,
      aktivna: formData.aktivna
    }

    console.log("Ovo mi je kljucno:", newYear);

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

  activateModal: any;

  openActivateModal(year: SchoolYear) {
    this.selectedYear = year;

    const modalEl = document.getElementById('activateYearModal')!;
    this.activateModal = new bootstrap.Modal(modalEl);
    this.activateModal.show();
  }

  confirmActivateYear() {
    if (!this.selectedYear) return;

    // 👉 OVDE ide backend poziv
    console.log('Aktiviram godinu:', this.selectedYear);

    this.schoolYearService.activateSelectedYearAndDeactivateOthers(this.selectedYear)
      .subscribe({
        next: (res) => {
          console.log("Nova aktivna godina:", res);
          this.activeYear = res.label;        // update label na frontu
          this.schoolYears.forEach(y => y.active = (y.id === res.id)); // update status svih godina
        },
        error: (err) => console.error("Greška pri aktiviranju godine", err)
      });

    this.activateModal.hide();
    this.selectedYear = null;
  }

  openExportRemoveModal(oznaka: String) {


    const schoolYearModalEl = document.getElementById('schoolYearModal');
    const schoolYearModalInstance = schoolYearModalEl ? bootstrap.Modal.getInstance(schoolYearModalEl) : null;
    schoolYearModalInstance?.hide();


    const modalEl = document.getElementById('exportRemoveYearModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }

  }


  async exportAndRemoveYear(yearToRemove: SchoolYear) {

    // Ovde treba samo da exportujem i uklnoim godinu i onda ce ostatak da mi se napravi nova godina

    console.log("Godina koju treba da uklonim:", yearToRemove);

    // Ucitavam podatke za izabranu godinu
    const distributions = await firstValueFrom(this.distributionService.getDistributionsByYear(yearToRemove.id));

    console.log("Raspodele za izabranu godinu:", distributions);

    this.exportAndRemoveData('distributions', 'json', distributions);

    await firstValueFrom(this.schoolYearService.deleteSchoolYear(yearToRemove.id));

    this.createNewYear(this.formData);

    // onda pravimo novu godinu sa podacima iz forme

  }

  exportAndRemoveData(type: 'teachers' | 'subjects' | 'distributions' | 'masterDoctoralClasses' | 'mentorCommission', format: 'json' | 'pdf', distributions?: Distribution[]) {
    if (format === 'json') {
      this.exportAndRemoveDataToJson(type, distributions)
    }

  }

  async exportAndRemoveDataToJson(type: 'teachers' | 'subjects' | 'distributions' | 'masterDoctoralClasses' | 'mentorCommission', distributions?: Distribution[]): Promise<void> {

    // let currentYear = this.schoolYearService.getCurrentYear();
    //
    // await this.loadAllDistributionsSubjectsTeachers(currentYear!.id)
    //
    let data;
    let fileName = '';

    switch (type) {
      // case 'teachers':
      //   data = this.teachers;
      //   fileName = 'nastavnici.json';
      //   break;
      // case 'subjects':
      //   data = this.subjects;
      //   fileName = 'predmeti.json';
      //   break;
      case 'distributions':
        data = distributions;
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



}
