import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SelectWithSearchComponent } from '../components/select_with_search/select_with_search.component';
import { UserService } from '../Services/user.service';
import { RolesService } from '../Services/roles.service';
import { UserWebtoolService } from '../Services/user-webtool.service';
import { WebtoolService } from '../Services/webtool.service';
import { 
  Webtool, 
  WebtoolUser, 
  UserRole, 
  CreateUserWebtoolDto, 
  WebtoolUserDisplay
} from '../../../interfaces/webtool.interfaces';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, from, map, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { HomeService } from '../Services/home.service';
import { ToastService } from '../Services/toast.service';
import { ConfirmationService } from '../Services/confirmation.service';


interface HeaderOption {
  id: number;
  value: string;
  label: string;
  privileges?: string;
}

interface UserOption {
  id: number;
  value: string;
  label: string;
}

@Component({
  selector: 'app-webtool-detail',
  standalone: true,
  imports: [CommonModule, SelectWithSearchComponent, FormsModule],
  providers: [UserService],
  templateUrl: './webtool-detail.component.html'
})
export class WebtoolDetailComponent implements OnInit, OnDestroy {
  webtoolId: number = 0;
  users: WebtoolUserDisplay[] = [];


  private destroy$ = new Subject<void>();
  private initComplete = false;


  searchTerm$ = new Subject<string>();
  adUsers: any[] = [];
  isSearching = false;

  
  webtoolName: string = '';
  showForm: boolean = false;
  userOptions: UserOption[] = [];
  selectedRoles: UserRole[] = [];
  roleOptions: HeaderOption[] = [];

  selectedWebtool: Webtool | null = null;


  formData = {
    userId: null as number | null,
    userName: '',
    email: '',
    department: ''
  };

  tableHeaders = [
    { name: 'userName', display_name: 'User', width: '20%' },
    { name: 'email', display_name: 'Email', width: '20%' },
    { name: 'department', display_name: 'Department', width: '20%' },
    { name: 'roles', display_name: 'Roles', width: '25%' },
    { name: 'actions', display_name: 'Actions', width: '15%' }  // New column
  ];
  // private reloadAllViews() {
  //   this.loadWebtoolDetails();
  //   this.loadUsersForWebtool();
  //   //this.loadAvailableUsers();
  //   this.loadRoles();
  // }
  private reloadAllViews() {
    if (this.webtoolId) {
      this.loadInitialData().subscribe();
    }
  }

  loadUserWebtoolData() {
    this.userWebtoolService.getAllUserWebtools().subscribe({
      next: (userWebtools) => {
        this.loadUsersForWebtool();
      }
    });
  }

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private rolesService: RolesService,
    private userWebtoolService: UserWebtoolService,
    private webtoolService: WebtoolService,
    private homeService: HomeService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {
    this.setupADSearch();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupADSearch() {
    let currentSearchTerm = '';

    this.searchTerm$.pipe(
      tap(term => {
        console.log('New search term:', term);
        currentSearchTerm = term;
      }),
      debounceTime(500),  // Increased from 300 to 500
      distinctUntilChanged(),
      tap(() => {
        console.log('Starting search after debounce for:', currentSearchTerm);
        this.isSearching = true;
        this.adUsers = [];
      }),
      switchMap(term => {
        if (term !== currentSearchTerm) {
          console.log('Search term changed, skipping old request');
          return of([]);
        }
        
        console.log('Making AD search request for:', term);
        return this.homeService.searchADUsers(term).pipe(
          tap(results => console.log('Search results received for term:', term, results)),
          catchError(error => {
            console.error('Search error:', error);
            return of([]);
          })
        );
      })
    ).subscribe({
      next: (users) => {
        console.log('Processing search results:', users);
        if (this.isSearching) {
          this.adUsers = users;
          this.isSearching = false;
          console.log('Updated adUsers array:', this.adUsers);
        }
      },
      error: (err) => {
        console.error('Subscription error:', err);
        this.adUsers = [];
        this.isSearching = false;
      }
    });
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
  selectADUser(user: any): void {
    console.log('Selected AD user:', user);
    
    this.formData = {
      userId: null,
      userName: user.name,
      email: user.email,
      department: user.department || ''
    };
    
    console.log('Updated form data:', this.formData);
    this.adUsers = [];
  }
  // ngOnInit() {
  //   const id = this.route.snapshot.paramMap.get('id');
  //   if (id) {
  //     this.webtoolId = +id;
  //     this.loadWebtoolDetails();
  //     this.loadUsersForWebtool();
  //     //this.loadAvailableUsers();
  //     this.loadRoles();
  //   }
  // }

  
  ngOnInit() {
    // Subscribe to route parameter changes
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.webtoolId = +id;
          return this.webtoolService.getWebtoolById(this.webtoolId).pipe(
            tap(webtool => {
              this.selectedWebtool = webtool;
              this.webtoolName = webtool.webtool;
            }),
            switchMap(() => this.loadInitialData())
          );
        }
        return EMPTY;
      })
    ).subscribe({
      error: (error) => {
        console.error('Error loading webtool details:', error);
        this.toastService.show('Error loading webtool details', 'error');
      }
    });
  }
  private loadInitialData() {
    return of(null).pipe(
      switchMap(() => {
        const tasks = [
          this.loadUsersForWebtool(),
          this.loadRoles()
        ];
        return from(Promise.all(tasks));
      })
    );
  }

  private loadWebtoolDetails() {
    this.webtoolService.getWebtoolById(this.webtoolId).subscribe({
      next: (webtool) => {
        this.selectedWebtool = webtool;
        this.webtoolName = webtool.webtool;
      },
      error: (error) => console.error('Error loading webtool details:', error)
    });
  }

  // loadAvailableUsers() {
  //   this.userService.getUsers().subscribe({
  //     next: (users) => {
  //       const existingUserIds = new Set(this.users.map(u => u.userId));
  //       this.userOptions = users
  //         .filter(user => !existingUserIds.has(user.id))
  //         .map(user => ({
  //           id: user.id,
  //           value: user.name,
  //           label: user.name
  //         }));
  //     },
  //     error: (error) => console.error('Error loading users:', error)
  //   });
  // }

  // loadRoles() {
  //   this.rolesService.getRolesByWebtool(this.webtoolId).subscribe({
  //     next: (roles) => {
  //       this.roleOptions = roles.map(role => ({
  //         id: role.id,
  //         value: role.roles,
  //         label: role.roles,
  //         privileges: role.privileges
  //       }));
  //     },
  //     error: (error) => console.error('Error loading roles:', error)
  //   });
  // }

  loadRoles() {
    if (!this.webtoolId) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.rolesService.getRolesByWebtool(this.webtoolId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (roles) => {
          this.roleOptions = roles.map(role => ({
            id: role.id,
            value: role.roles,
            label: role.roles,
            privileges: role.privileges
          }));
          resolve(true);
        },
        error: (error) => {
          console.error('Error loading roles:', error);
          reject(error);
        }
      });
    });
  }


  // loadUsersForWebtool() {
  //   if (!this.webtoolId) return;

  //   this.userWebtoolService.getConsolidatedUserData().subscribe({
  //     next: (allUsers) => {
  //       this.users = allUsers
  //         .filter(user => user.webtools?.includes(this.selectedWebtool?.webtool || ''))
  //         .map(user => ({
  //           userId: user.userId,
  //           userName: user.userName,
  //           email: user.email,
  //           department: user.department,
  //           roles: user.roles[this.webtoolId] || [], 
  //           webtools: user.webtools
  //         }));

  //       console.log('Filtered users for webtool:', this.users);
  //       //this.loadAvailableUsers();
  //     },
  //     error: (error) => console.error('Error loading users:', error)
  //   });
  // }

  loadUsersForWebtool() {
    if (!this.webtoolId) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.userWebtoolService.getConsolidatedUserData().pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (allUsers) => {
          this.users = allUsers
            .filter(user => user.webtools?.includes(this.selectedWebtool?.webtool || ''))
            .map(user => ({
              userId: user.userId,
              userName: user.userName,
              email: user.email,
              department: user.department,
              roles: user.roles[this.webtoolId] || [],
              webtools: user.webtools,
              isActive: user.isActive !== undefined ? user.isActive : true
            }));
          resolve(true);
        },
        error: (error) => {
          console.error('Error loading users:', error);
          reject(error);
        }
      });
    });
  }

  onUserChange(selectedUserName: string) {
    const selectedUser = this.userOptions.find(user => user.value === selectedUserName);
    if (selectedUser) {
      this.userService.getUsers().subscribe({
        next: (users) => {
          const user = users.find(u => u.id === selectedUser.id);
          if (user) {
            this.formData = {
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

  onRoleChange(selectedRole: string) {
    const role = this.roleOptions.find(r => r.value === selectedRole);
    if (role && !this.selectedRoles.some(r => r.id === role.id)) {
      this.selectedRoles.push({
        id: role.id,
        name: role.value,
        privileges: role.privileges || ''
      });
    }
  }

  removeSelectedRole(role: UserRole) {
    this.selectedRoles = this.selectedRoles.filter(r => r.id !== role.id);
  }
  // addUserToWebtool() {
  //   if (!this.formData.email || !this.selectedWebtool) {
  //     console.error('Missing required data');
  //     return;
  //   }

  //   if (this.selectedRoles.length === 0) {
  //     this.rolesService.getRolesByWebtool(this.selectedWebtool.id).subscribe({
  //       next: (roles) => {
  //         if (!roles || roles.length === 0) {
  //           alert('No roles defined for this webtool');
  //           return;
  //         }

  //         this.createUserWebtoolAssignment(roles[0].id);
  //       },
  //       error: (error) => {
  //         console.error('Error loading roles:', error);
  //         alert('Failed to load roles');
  //       }
  //     });
  //   } else {
  //     const createPromises = this.selectedRoles.map(role => 
  //       this.createUserWebtoolAssignment(role.id)
  //     );

  //     Promise.all(createPromises)
  //       .then(() => {
  //         this.reloadAllViews();
  //         this.closeForm();
  //       })
  //       .catch(error => {
  //         console.error('Error creating assignments:', error);
  //         alert('Failed to add user to webtool');
  //       });
  //   }
  // }


  addUserToWebtool() {
    if (!this.formData.email || !this.selectedWebtool) {
      console.error('Missing required data');
      return;
    }
  
    this.userWebtoolService.getUserWebtoolsByUser(this.formData.email).pipe(
      map(userWebtools => {
        // Check if user exists in THIS specific webtool
        const existingAssignment = userWebtools.find(uw => 
          uw.webtoolId === this.selectedWebtool!.id
        );
        if (existingAssignment) {
          throw new Error('User already exists in this webtool');
        }
        return userWebtools;
      }),
      switchMap(() => {
        if (this.selectedRoles.length === 0) {
          return this.rolesService.getRolesByWebtool(this.selectedWebtool!.id).pipe(
            switchMap(roles => {
              if (!roles || roles.length === 0) {
                throw new Error('No roles defined for this webtool');
              }
              return of(this.createUserWebtoolAssignment(roles[0].id));
            })
          );
        } else {
          const createPromises = this.selectedRoles.map(role => 
            this.createUserWebtoolAssignment(role.id)
          );
          return from(Promise.all(createPromises));
        }
      }),
      catchError(error => {
        if (error.message === 'User already exists in this webtool') {
          this.toastService.show('This user already has access to this webtool', 'error');
        } else if (error.message === 'No roles defined for this webtool') {
          this.toastService.show('No roles defined for this webtool', 'error');
        } else {
          this.toastService.show('Failed to add user to webtool', 'error');
          console.error('Error creating assignments:', error);
        }
        return EMPTY;
      })
    ).subscribe({
      next: () => {
        this.toastService.show('User added successfully', 'success');
        this.reloadAllViews();
        this.closeForm();
      }
    });
  }
  private createUserWebtoolAssignment(roleId: number): Promise<any> {
    const userWebtoolData: CreateUserWebtoolDto = {
      email: this.formData.email,
      userName: this.formData.userName,
      department: this.formData.department,
      webtoolId: this.selectedWebtool!.id,
      roleId: roleId
    };

    return this.userWebtoolService.createUserWebtool(userWebtoolData).toPromise();
  }
  openForm() {
    this.showForm = true;
    this.formData = {
      userId: null,
      userName: '',
      email: '',
      department: ''
    };
    this.selectedRoles = [];
  }


  // deleteUser(user: WebtoolUserDisplay) {
  //   if (confirm('Are you sure you want to remove this user from the webtool?')) {
  //     this.userWebtoolService.deleteUserWebtool(user.email, this.webtoolId).subscribe({
  //       next: () => {
  //         // Refresh the users list
  //         this.loadUsersForWebtool();
  //       },
  //       error: (error) => {
  //         console.error('Error deleting user:', error);
  //         // Add toast service if you have one
  //         alert('Failed to delete user');
  //       }
  //     });
  //   }
  // }

  deleteUser(user: WebtoolUserDisplay) {
    this.confirmationService.show(
      'Remove User',
      'Are you sure you want to remove this user from the webtool?',
      () => {
        this.userWebtoolService.deleteUserWebtool(user.email, this.webtoolId).subscribe({
          next: () => {
            this.loadUsersForWebtool();
            this.toastService.show('User removed successfully', 'success');
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.toastService.show('Failed to remove user', 'error');
          }
        });
      }
    );
  }
  closeForm() {
    this.showForm = false;
    this.formData = {
      userId: null,
      userName: '',
      email: '',
      department: ''
    };
    this.selectedRoles = [];
  }
}