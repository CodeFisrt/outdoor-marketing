// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-add-user-form',
//   imports: [],
//   templateUrl: './add-user-form.html',
//   styleUrl: './add-user-form.css'
// })
// export class AddUserForm {

// }


import { NgClass, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-add-user-form',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, NgClass, NgIf],
  templateUrl: './add-user-form.html',
  styleUrl: './add-user-form.css'
})
export class AddUserForm {
  userForm!: FormGroup;
  userId?: number;
  submitted = false;
  selectedRole: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.userForm = this.fb.group(
      {
        role: ['', Validators.required],
        status: ['active', Validators.required],

        userName: ['', Validators.required],
        userEmail: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],

        // agency
        agencyName: [''],
        agencyPhone: [''],
        agencyCity: [''],

        // screen owner
        ownerCompanyName: [''],
        ownerPhone: [''],
        ownerAddress: [''],
        ownerCity: [''],

        // guest
        guestPhone: [''],
        guestCity: ['']
      },
      { validators: [this.passwordMatchValidator('password', 'confirmPassword', 'passwordMismatch')] }
    );

    // role change -> apply validators + show fields
    this.userForm.get('role')?.valueChanges.subscribe((role: string) => {
      this.selectedRole = role;
      this.applyRoleValidators(role);
    });

    // Edit mode (optional later)
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('edit');
      if (id) {
        this.userId = +id;
        // later: load user by id and patchValue
        // this.loadUser(this.userId);
      }
    });
  }

  // ✅ show errors only after submit OR touched
  isInvalid(controlName: string): boolean {
    const c = this.userForm.get(controlName);
    return !!(c && c.invalid && (c.touched || this.submitted));
  }

  hasFormError(errorKey: string): boolean {
    return !!(this.userForm.errors && this.userForm.errors[errorKey] && (this.submitted || this.anyTouched()));
  }

  private anyTouched(): boolean {
    return Object.keys(this.userForm.controls).some(k => this.userForm.get(k)?.touched);
  }

  private passwordMatchValidator(passKey: string, confirmKey: string, errorKey: string) {
    return (group: AbstractControl): ValidationErrors | null => {
      const pass = group.get(passKey)?.value;
      const confirm = group.get(confirmKey)?.value;

      if (!pass || !confirm) return null;
      if (pass !== confirm) return { [errorKey]: true };

      // remove only this error if exists
      if (group.errors?.[errorKey]) {
        const { [errorKey]: _, ...rest } = group.errors || {};
        return Object.keys(rest).length ? rest : null;
      }
      return null;
    };
  }

  private applyRoleValidators(role: string) {
    // clear validators for role-wise fields
    const roleFields = [
      'agencyName','agencyPhone','agencyCity',
      'ownerCompanyName','ownerPhone','ownerAddress','ownerCity'
    ];

    roleFields.forEach(f => {
      this.userForm.get(f)?.clearValidators();
      this.userForm.get(f)?.setValue('');
      this.userForm.get(f)?.updateValueAndValidity({ emitEvent: false });
    });

    // apply required based on role
    if (role === 'agency') {
      this.userForm.get('agencyName')?.setValidators([Validators.required]);
      this.userForm.get('agencyPhone')?.setValidators([Validators.required]);
      this.userForm.get('agencyCity')?.setValidators([Validators.required]);
    }

    if (role === 'screenOwner') {
      this.userForm.get('ownerCompanyName')?.setValidators([Validators.required]);
      this.userForm.get('ownerPhone')?.setValidators([Validators.required]);
      this.userForm.get('ownerAddress')?.setValidators([Validators.required]);
      this.userForm.get('ownerCity')?.setValidators([Validators.required]);
    }

    roleFields.forEach(f => this.userForm.get(f)?.updateValueAndValidity({ emitEvent: false }));
  }

  private resetToDefaults() {
    this.userForm.reset({
      role: '',
      status: 'active'
    });
    this.selectedRole = '';
    this.submitted = false;
  }

  save() {
    this.submitted = true;

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const payload = { ...this.userForm.value };

    // ✅ TEMP: no database right now
    console.log('USER PAYLOAD:', payload);

    if (this.userId) {
      this.toastr.success('User updated (temporary) ✅');
    } else {
      this.toastr.success('User added (temporary) 🎉');
    }

    this.router.navigateByUrl('/dashboard/users');
  }

  cancel() {
    // In edit mode, keep old data
    if (this.userId) return;

    // In add mode, clear form
    this.resetToDefaults();
  }

  resetForm() {
    // In edit mode, we would reload old data later
    if (this.userId) {
      // later: this.loadUser(this.userId);
      this.submitted = false;
      return;
    }

    this.resetToDefaults();
  }
}
