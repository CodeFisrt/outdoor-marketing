// add-user-form.ts
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

import { UserApiService } from '../../../ApiServices/user-api.service'; // ✅ adjust path if needed

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
    private toastr: ToastrService,
    private userApi: UserApiService
  ) {}

  ngOnInit(): void {
    this.userForm = this.fb.group(
      {
        role: ['', Validators.required],
        status: ['active', Validators.required],

        userName: ['', Validators.required],
        userEmail: ['', [Validators.required, Validators.email]],

        // ✅ required for create, optional for edit
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

    // role change => apply validators
    this.userForm.get('role')?.valueChanges.subscribe((role: string) => {
      this.selectedRole = role;
      this.applyRoleValidators(role);
    });

    // ✅ Edit mode: /dashboard/users/add?edit=12
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('edit');
      if (id) {
        this.userId = +id;
        this.loadUserForEdit(this.userId);

        // ✅ make password optional during edit
        this.makePasswordOptionalForEdit();
      }
    });
  }

  // ============================
  // ✅ Edit: load user into form
  // ============================
  loadUserForEdit(id: number) {
    this.userApi.getUserById(id).subscribe({
      next: (u: any) => {
        const role = u?.role || '';
        this.selectedRole = role;

        // ✅ patch values
        this.userForm.patchValue({
          role: role,
          status: u.status || 'active',

          userName: u.userName || '',
          userEmail: u.userEmail || '',

          // password not returned by backend (keep empty)
          password: '',
          confirmPassword: '',

          // agency
          agencyName: u.agencyName || '',
          agencyPhone: u.agencyPhone || '',
          agencyCity: u.agencyCity || '',

          // owner
          ownerCompanyName: u.ownerCompanyName || '',
          ownerPhone: u.ownerPhone || '',
          ownerAddress: u.ownerAddress || '',
          ownerCity: u.ownerCity || '',

          // guest
          guestPhone: u.guestPhone || '',
          guestCity: u.guestCity || ''
        });

        // ✅ re-apply role validators so fields show required correctly
        this.applyRoleValidators(role);

        this.submitted = false;
      },
      error: (err) => {
        console.error('Load user error:', err);
        this.toastr.error('Failed to load user');
        this.router.navigateByUrl('/dashboard/users-list');
      }
    });
  }

  makePasswordOptionalForEdit() {
    // ✅ remove required validators in edit mode
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity({ emitEvent: false });

    this.userForm.get('confirmPassword')?.clearValidators();
    this.userForm.get('confirmPassword')?.updateValueAndValidity({ emitEvent: false });
  }

  // ============================
  // ✅ Validation helpers
  // ============================
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

      // ✅ In edit mode, if password empty => don't validate mismatch
      if (this.userId && (!pass || !confirm)) return null;

      if (!pass || !confirm) return null;
      if (pass !== confirm) return { [errorKey]: true };

      if (group.errors?.[errorKey]) {
        const { [errorKey]: _, ...rest } = group.errors || {};
        return Object.keys(rest).length ? rest : null;
      }
      return null;
    };
  }

  private applyRoleValidators(role: string) {
    const roleFields = [
      'agencyName','agencyPhone','agencyCity',
      'ownerCompanyName','ownerPhone','ownerAddress','ownerCity'
    ];

    // clear previous role validators
    roleFields.forEach(f => {
      this.userForm.get(f)?.clearValidators();

      // clear values ONLY if creating new user
      if (!this.userId) {
        this.userForm.get(f)?.setValue('');
      }

      this.userForm.get(f)?.updateValueAndValidity({ emitEvent: false });
    });

    // apply new role validators
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
    this.userId = undefined;
  }

  // ============================
  // ✅ Create / Update
  // ============================
  save() {
    this.submitted = true;

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const payload: any = { ...this.userForm.value };
    delete payload.confirmPassword;

    // ✅ trim strings
    Object.keys(payload).forEach(k => {
      if (typeof payload[k] === 'string') payload[k] = payload[k].trim();
    });

    // ✅ EDIT MODE => UPDATE
    if (this.userId) {
      // if password empty => don't send it
      if (!payload.password) delete payload.password;

      this.userApi.updateUser(this.userId, payload).subscribe({
        next: (res: any) => {
          this.toastr.success(res?.message || "User updated successfully ✅");
          this.router.navigateByUrl('/dashboard/users-list');
        },
        error: (err) => {
          this.toastr.error(err?.error?.message || "Failed to update user");
        }
      });
      return;
    }

    // ✅ CREATE MODE => REGISTER
    this.userApi.createUser(payload).subscribe({
      next: (res: any) => {
        this.toastr.success(res?.message || "User created successfully ✅");
        this.router.navigateByUrl('/dashboard/users-list');
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || "Failed to create user");
      }
    });
  }

  cancel() {
    // if edit mode, go back
    if (this.userId) {
      this.router.navigateByUrl('/dashboard/users-list');
      return;
    }
    this.resetToDefaults();
  }

  resetForm() {
    if (this.userId) {
      // reload original user details
      this.submitted = false;
      this.loadUserForEdit(this.userId);
      return;
    }
    this.resetToDefaults();
  }
}
