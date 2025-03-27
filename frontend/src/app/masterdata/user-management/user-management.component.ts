import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../Services/users.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { ToastService } from '../../Services/toast.service';

interface UserRole {
  id: number;
  role: Role;
  roleId?: number;  
}

interface Role {
  id: number;
  role: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  user_roles: UserRole[];
}

interface CreateUserDto {
  email: string;
  name: string;
  is_active: boolean;
  user_roles: { roleId: number }[];
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-management.component.html'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  roles: Role[] = [];
  showModal = false;
  editMode = false;
  selectedUser: Partial<User> | null = null;
  selectedRoles: number[] = [];
  
  searchTerm$ = new Subject<string>();
  adUsers: any[] = [];
  isSearching = false;

  constructor(
    private usersService: UsersService,
    private toastService: ToastService
  ) {
    this.searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.isSearching = true;
        return this.usersService.searchADUsers(term);
      })
    ).subscribe({
      next: (users) => {
        this.adUsers = users;
        this.isSearching = false;
      },
      error: (err) => {
        console.error('Error searching AD:', err);
        this.isSearching = false;
        this.toastService.show('Failed to search Active Directory users', 'error');
      }
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.usersService.findAll().subscribe({
      next: (users) => {
        this.users = users.map(user => ({
          ...user,
          user_roles: user.user_roles || []
        }));
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.toastService.show('Failed to load users', 'error');
      }
    });
    
    this.usersService.findAllRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.toastService.show('Failed to load roles', 'error');
      }
    });
  }

  openForm(mode: 'add' | 'edit', user?: User) {
    this.editMode = mode === 'edit';
    this.showModal = true;
    this.selectedUser = user || null;
    
    if (user) {
      this.selectedRoles = user.user_roles.map(ur => ur.role.id);
    } else {
      this.selectedRoles = [];
    }
  }

  editUser(user: User) {
    this.editMode = true;
    this.showModal = true;
    this.selectedUser = user;
    this.selectedRoles = user.user_roles?.map(ur => ur.role.id) || [];
  }
  saveUser() {
    if (!this.selectedUser) return;

    if (!this.selectedUser.email?.trim() || !this.selectedUser.name?.trim()) {
      this.toastService.show('Email and Name are required', 'error');
      return;
    }

    if (this.selectedRoles.length === 0) {
      this.toastService.show('Please select at least one role', 'error');
      return;
    }

    if (this.editMode && this.selectedUser.id) {
      this.usersService.updateUserRoles(this.selectedUser.id, this.selectedRoles).subscribe({
        next: () => {
          this.loadData();
          this.closeModal();
          this.toastService.show('User updated successfully', 'success');
        },
        error: (error) => {
          console.error('Update error:', error);
          if (error.status === 409) {
            this.toastService.show(error.error.message || 'A user with this email already exists', 'error');
          } else if (error.status === 404) {
            this.toastService.show('User or role not found', 'error');
          } else {
            this.toastService.show('Failed to update user', 'error');
          }
        }
      });
    } else {
      // Cast the userData to any to bypass the type checking
      const userData = {
        email: this.selectedUser.email,
        name: this.selectedUser.name,
        is_active: true,
        user_roles: this.selectedRoles.map(roleId => ({ roleId }))
      } as any;

      this.usersService.create(userData).subscribe({
        next: () => {
          this.loadData();
          this.closeModal();
          this.toastService.show('User added successfully', 'success');
        },
        error: (error) => {
          console.error('Create error:', error);
          if (error.status === 409) {
            this.toastService.show(error.error.message || 'A user with this email already exists', 'error');
          } else {
            this.toastService.show('Failed to add user', 'error');
          }
        }
      });
    }
  }
  closeModal() {
    this.showModal = false;
    this.selectedUser = null;
    this.selectedRoles = [];
    this.adUsers = [];
  }

  onUserSearch(event: any): void {
    const term = event.target.value.trim();
    console.log('Search input changed:', term);
    
    if (term.length >= 3) {
      console.log('Term length >= 3, emitting search');
      this.isSearching = true;
      this.searchTerm$.next(term);
    } else {
      console.log('Term too short, clearing results');
      this.isSearching = false;
      this.adUsers = [];
    }
  }

  // selectADUser(user: any) {
  //   this.selectedUser = {
  //     email: user.email,
  //     name: user.name,
    
  //   };
  //   this.adUsers = [];
  // }

  // In user-management.component.ts
selectADUser(user: any) {
  this.selectedUser = {
    email: user.email.toLowerCase(), // Convert to lowercase
    name: user.name,
  };
  this.adUsers = [];
}

  isRoleSelected(roleId: number): boolean {
    return this.selectedRoles.includes(roleId);
  }

  toggleRole(roleId: number) {
    const index = this.selectedRoles.indexOf(roleId);
    if (index === -1) {
      this.selectedRoles.push(roleId);
    } else {
      this.selectedRoles.splice(index, 1);
    }
  }

  getRoleById(roleId: number): Role | undefined {
    return this.roles.find(r => r.id === roleId);
  }


  updateStatus(userId: number, event: Event) {
    const isActive = (event.target as HTMLInputElement).checked;
    this.usersService.update(userId, { is_active: isActive }).subscribe({
      next: () => {
        this.loadData();
        this.toastService.show('User status updated successfully', 'success');
      },
      error: (error) => {
        console.error('Status update error:', error);
        this.toastService.show('Failed to update user status', 'error');
      }
    });
  }

  deleteUser(userId: number) {
    const confirmation = confirm('Are you sure you want to delete this user?');
    if (!confirmation) return;

    this.usersService.remove(userId).subscribe({
      next: () => {
        this.loadData();
        this.toastService.show('User deleted successfully', 'success');
      },
      error: (error) => {
        console.error('Delete error:', error);
        if (error.status === 404) {
          this.toastService.show('User not found', 'error');
        } else {
          this.toastService.show('Failed to delete user', 'error');
        }
      }
    });
  }
}