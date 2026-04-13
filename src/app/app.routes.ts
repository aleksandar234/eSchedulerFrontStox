import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/Administration/home/home.component';
import {TeacherComponent} from './components/Administration/teacher/teacher.component';
import {SubjectComponent} from './components/Administration/subject/subject.component';
import {DistributionComponent} from './components/Administration/distribution/distribution.component';
import {LayoutComponent} from './components/Administration/layout/layout.component';
import {StandardUsersComponent} from './components/standard-users/standard-users.component';
import {AuthGuard} from './guards/auth.guard';
import {AdminGuard} from './guards/admin.guard';

// export const routes: Routes = [
//   {path: '', component: LayoutComponent, children: [
//     {path: 'teachers', component: TeacherComponent, canActivate: [AuthGuard, AdminGuard]},
//     {path: 'subjects', component: SubjectComponent, canActivate: [AuthGuard, AdminGuard]},
//     {path: 'distribution', component: DistributionComponent, canActivate: [AuthGuard, AdminGuard]},
//     { path: '', component: HomeComponent,canActivate: [AuthGuard, AdminGuard]},
//   ]},
//   { path: 'standardUser', component: StandardUsersComponent, canActivate: [AuthGuard] },
//   { path: 'login', component: LoginComponent },
// ];


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'teachers', component: TeacherComponent, canActivate: [AuthGuard, AdminGuard] },
      { path: 'subjects', component: SubjectComponent, canActivate: [AuthGuard, AdminGuard] },
      { path: 'distribution', component: DistributionComponent, canActivate: [AuthGuard, AdminGuard] },
      { path: 'home', component: HomeComponent, canActivate: [AuthGuard, AdminGuard] },
    ]
  },

  { path: 'standardUser', component: StandardUsersComponent, canActivate: [AuthGuard] },
];
