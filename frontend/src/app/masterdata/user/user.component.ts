import { Component, OnInit } from '@angular/core';
import { UserService } from '../../Services/user.service';
import { DepartmentService } from '../../Services/department.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectWithSearchComponent } from '../../components/select_with_search/select_with_search.component';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface Department {
  id: number;
  department: string;
}

interface HeaderOption {
  id: number;
  value: string;
  label: string;
}

interface Header {
  name: string;
  display_name: string;
  width: string;
  type?: string;
  options?: HeaderOption[];
}

interface User {
  id?: number;
  name: string;
  email: string;
  departmentId: number;
  department?: { id: number; department: string };
}

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [FormsModule, CommonModule, SelectWithSearchComponent],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent implements OnInit {
  users: User[] = [];
  departments: Department[] = [];
  departmentOptions: HeaderOption[] = [];
  isFormOpen = false;
  
  searchTerm$ = new Subject<string>();
  adUsers: any[] = [];
  isSearching = false;

  filteredDepartments: Department[] = [];

  editForm = {
    username: '', 
    name: '',
    email: '',
    departmentId: null as number | null,
    
  };

  
  selectedRowIndex: number | null = null;

  userHeaders: Header[] = [
    { name: 'name', display_name: 'Name', width: '30%' },
    { name: 'email', display_name: 'Email', width: '40%' },
    { 
      name: 'department',
      display_name: 'Department',
      type: 'combobox',
      width: '30%',
      options: []
    }
  ];

  constructor(
    private userService: UserService,
    private departmentService: DepartmentService
  ) {
    this.searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.isSearching = true;
        return this.userService.searchADUsers(term);
      })
    ).subscribe({
      next: (users) => {
        this.adUsers = users;
        this.isSearching = false;
      },
      error: (err) => {
        console.error('Error searching AD users:', err);
        this.isSearching = false;
      }
    });
  }

  onUsernameSearch(event: any): void {
    console.log(this.adUsers);
    const term = event.target.value;
    if (term.length >= 3) {
      this.searchTerm$.next(term);
    } else {
      this.adUsers = [];
    }
  }

  selectADUser(user: any): void {
    this.editForm.username = user.name;
    this.editForm.name = user.name;
    this.editForm.email = user.email;
    
    // Find matching department
    const department = this.departments.find(
      dept => dept.department.toLowerCase() === user.department?.toLowerCase()
    );
    if (department) {
      this.editForm.departmentId = department.id;
    }
    
    this.adUsers = []; // Clear search results
  }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadUsers();
  }

  toggleForm(): void {
    this.isFormOpen = !this.isFormOpen;
    if (!this.isFormOpen) {
      this.resetForm();
    }
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (departments: Department[]) => {
        this.departments = departments;
        this.departmentOptions = departments.map(dept => ({
          id: dept.id,
          value: dept.department,
          label: dept.department
        }));
        this.userHeaders[2].options = [...this.departmentOptions];
      },
      error: (error) => console.error('Error loading departments:', error)
    });
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => console.error('Error loading users:', error)
    });
  }

  onDepartmentChange(event: string): void {
    const department = this.departmentOptions.find(d => d.value === event);
    if (department) {
      this.editForm.departmentId = department.id;
    }
  }

  onAddUser() {
    if (!this.editForm.name || !this.editForm.email || !this.editForm.departmentId) {
      alert('Please fill in all fields');
      return;
    }

    // Create DTO object with only the required fields for the API
    const userData = {
      name: this.editForm.name,
      email: this.editForm.email,
      departmentId: this.editForm.departmentId
    } as const; // Type assertion to match the DTO

    this.userService.createUser(userData).subscribe({
      next: () => {
        this.loadUsers();
        this.resetForm();
      },
      error: (error) => {
        console.error('Error creating user:', error);
        alert('Failed to create user');
      }
    });
  }

  saveEditedUser() {
    if (this.selectedRowIndex !== null) {
      const userData = {
        name: this.editForm.name,
        email: this.editForm.email,
        departmentId: this.editForm.departmentId
      };

      const userId = this.users[this.selectedRowIndex].id;
      
      if (!userId) {
        console.error('No user ID found for update');
        return;
      }

      this.userService.updateUser(userId, userData).subscribe({
        next: () => {
          this.loadUsers();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error updating user:', error);
          alert('Failed to update user');
        }
      });
    }
  }

  onEdit(user: User, index: number) {
    this.selectedRowIndex = index;
    this.editForm = {
      username: user.name,  // Add this line to include username
      name: user.name,
      email: user.email,
      departmentId: user.departmentId ?? user.department?.id ?? null
    };
    this.isFormOpen = true;
}

  onDelete(user: User) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(user.id!).subscribe({
        next: () => this.loadUsers(),
        error: (error) => {
          console.error('Error deleting user:', error);
          alert('Failed to delete user');
        }
      });
    }
  }
  private resetForm() {
    this.editForm = {
      username: '',
      name: '',
      email: '',
      departmentId: null
    };
    this.selectedRowIndex = null;
    this.adUsers = [];
  }
}