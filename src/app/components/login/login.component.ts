import { Component, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { UsersService } from '../../services/users/users.service';
import { AuthService } from '../../services/auth.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  constructor(
    private usersService: UsersService,
    private oauthService: OAuthService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('LoginComponent ucitan');

    const loggedOut = localStorage.getItem('loggedOut');
    if (loggedOut === 'true') {
      console.log('Korisnik se upravo logoutovao, preskacem auto-login');
      localStorage.removeItem('loggedOut');
      return;
    }

    this.oauthService.tryLoginImplicitFlow().then(() => {
      console.log('Povratak sa Google-a');

      const idToken = this.oauthService.getIdToken();
      console.log('ID TOKEN:', idToken);

      if (!idToken) {
        console.log('Nema idToken');
        return;
      }

      this.usersService.authenticateUser(idToken).subscribe({
        next: (response: any) => {
          console.log('BACKEND RESPONSE:', response);

          if (response.token) {
            this.authService.setToken(response.token);
            this.redirectBasedOnRole();
          } else {
            console.log('Nema tokena u response');
            this.router.navigate(['/login']);
          }
        },
        error: (error) => {
          console.log('HTTP ERROR:', error);
          this.router.navigate(['/login']);
        }
      });
    });
  }


  loginWithGoogle() {
    console.log('1. loginWithGoogle pozvan');

    this.oauthService.initLoginFlow();

    // this.oauthService.tryLoginImplicitFlow().then(() => {
    //   console.log('2. tryLoginImplicitFlow gotov');
    //   this.handleLoginSuccess();
    // });
  }

  private handleLoginSuccess() {
    console.log('3. handleLoginSuccess pozvan');

    const idToken = this.oauthService.getIdToken();
    console.log('4. ID TOKEN:', idToken);

    if (!idToken) {
      console.log('5. Nema idToken, vraca na login');
      this.router.navigate(['/login']);
      return;
    }

    this.usersService.authenticateUser(idToken).subscribe({
      next: (response: any) => {
        debugger;
        console.log('6. BACKEND RESPONSE:', response);
        console.log('7. response.token =', response?.token);

        if (response.token) {
          console.log('8. Token postoji, cuvam token');
          this.authService.setToken(response.token);

          console.log('9. Token sacuvan:', this.authService.getToken());
          console.log('10. Pozivam redirectBasedOnRole');
          this.redirectBasedOnRole();
        } else {
          console.log('11. Nema tokena u response, vracam na login');
          this.router.navigate(['/login']);
        }
      },
      error: (error) => {
        console.log('12. HTTP ERROR:', error);
        this.router.navigate(['/login']);
      },
    });
  }

  private redirectBasedOnRole() {
    console.log('13. Usao u redirectBasedOnRole');

    if (this.authService.isAdmin()) {
      console.log('14. Admin je ulogovan, redirektuje na home');
      this.router.navigate(['/home']);
    } else {
      console.log('15. Admin nije ulogovan, redirektuje na standardUser');
      this.router.navigate(['/standardUser']);
    }
  }
}
