import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectWithSearchComponent } from '../components/select_with_search/select_with_search.component';
import { UserService } from '../Services/user.service';
import { WebtoolService } from '../Services/webtool.service';
import { WebtoolUserService } from '../Services/webtool-user.service';
import { RolesService } from '../Services/roles.service';
import { ActivatedRoute } from '@angular/router';
import { WebtoolUser } from '../../../interfaces/webtool.interfaces';

interface User {
  id: number;
  name: string;
  email: string;
  department?: { id: number; department: string };
}

interface UserRecord {
  userId: number;
  userName: string;
  email: string;
  department: string;
  roles: UserRole[];  // Change this to array instead of object
  webtools?: string[];
  isExpanded?: boolean;
}
interface UserRole {
  id: number;
  name: string;
  privileges: string;
}

interface HeaderOption {
  id: number;
  value: string;
  label: string;
  privileges?: string;
}

@Component({
  selector: 'app-webtool-user',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectWithSearchComponent],
  providers: [UserService],
  templateUrl: './webtool-user.component.html'
})
export class WebtoolUserComponent implements OnInit {
  records: UserRecord[] = [];
  selectedRoles: UserRole[] = [];
  showForm = false;
  isEditMode = false;
  selectedRowIndex: number | null = null;

  webtoolId: number = 0;
  userOptions: HeaderOption[] = [];
  roleOptions: HeaderOption[] = [];

  editForm = {
    userId: null as number | null,
    userName: '',
    email: '',
    department: '',
    roleId: null as number | null,
    role: '',
    privileges: ''
  };

  tableHeaders = [
    { name: 'actions', display_name: 'Actions', width: '10%' },
    { name: 'userName', display_name: 'User', width: '25%' },
    { name: 'department', display_name: 'Department', width: '20%' },
    { name: 'email', display_name: 'Email', width: '20%' },
    { name: 'roles', display_name: 'Roles', width: '25%' }
  ];

  constructor(
    private userService: UserService,
    private webtoolService: WebtoolService,
    private webtoolUserService: WebtoolUserService,
    private rolesService: RolesService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.webtoolId = +id;
    }
    this.loadUsers();
    this.loadRecords();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.userOptions = users.map(user => ({
          id: user.id,
          value: user.name,
          label: user.name
        }));
      },
      error: (error) => console.error('Error loading users:', error)
    });
  }

  loadRecords() {
    this.webtoolUserService.getRecords().subscribe({
      next: (records: WebtoolUser[]) => {
        this.records = records.map(record => {
          const rolesArray = Object.values(record.roles).flat();
          return {
            userId: record.userId,
            userName: record.userName,
            email: record.email,
            department: record.department,
            roles: rolesArray,
            webtools: record.webtools,
            isExpanded: false
          };
        });
      },
      error: (error) => {
        console.error('Error loading records:', error);
        alert('Failed to load records');
      }
    });
  }
  toggleRowExpansion(index: number) {
    this.records[index].isExpanded = !this.records[index].isExpanded;
  }

openForm(mode: 'add' | 'edit', record?: UserRecord, index?: number) {
  this.isEditMode = mode === 'edit';
  this.showForm = true;
  
  if (mode === 'edit' && record) {
    this.selectedRowIndex = index ?? null;
    this.editForm = {
      userId: record.userId,
      userName: record.userName,
      email: record.email,
      department: record.department,
      roleId: null,
      role: '',
      privileges: ''
    };
    this.selectedRoles = record.roles.map(role => ({
      id: role.id,
      name: role.name,
      privileges: role.privileges
    }));
  } else {
    this.resetForm();
  }
}

  closeForm() {
    this.showForm = false;
    this.isEditMode = false;
    this.resetForm();
  }

  onUserChange(event: string) {
    const selectedUser = this.userOptions.find(user => user.value === event);
    if (selectedUser) {
      this.userService.getUsers().subscribe({
        next: (users) => {
          const user = users.find(u => u.id === selectedUser.id);
          if (user) {
            this.editForm = {
              ...this.editForm,
              userId: user.id,
              userName: user.name,
              email: user.email,
              department: user.department?.department || ''
            };
          }
        }
      });
    }
  }

  onRoleChange(event: string) {
    const selectedRole = this.roleOptions.find(role => role.value === event);
    if (selectedRole && !this.selectedRoles.some(r => r.id === selectedRole.id)) {
      this.selectedRoles.push({
        id: selectedRole.id,
        name: selectedRole.value,
        privileges: selectedRole.privileges || ''
      });
    }
  }

  removeSelectedRole(role: UserRole) {
    this.selectedRoles = this.selectedRoles.filter(r => r.id !== role.id);
  }

  private resetForm() {
    this.editForm = {
      userId: null,
      userName: '',
      email: '',
      department: '',
      roleId: null,
      role: '',
      privileges: ''
    };
    this.selectedRoles = [];
  }

  onSave() {
    if (!this.editForm.userId || this.selectedRoles.length === 0) {
      alert('Please select a user and at least one role');
      return;
    }
  
    const roleIds = this.selectedRoles.map(role => role.id);
  
    if (this.isEditMode) {
      this.webtoolUserService.updateRecord(
        this.editForm.userId,
        this.webtoolId,
        roleIds
      ).subscribe({
        next: () => {
          this.loadRecords();
          this.closeForm();
        },
        error: (error) => {
          console.error('Error updating record:', error);
          alert('Failed to update record');
        }
      });
    } else {
      this.webtoolUserService.createRecord(
        this.editForm.userId,
        this.webtoolId,
        roleIds
      ).subscribe({
        next: () => {
          this.loadRecords();
          this.closeForm();
        },
        error: (error) => {
          console.error('Error creating record:', error);
          alert('Failed to create record');
        }
      });
    }
  }
}