import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { WebtoolService } from '../Services/webtool.service';
import { UserService } from '../Services/user.service';
import { RolesService } from '../Services/roles.service';
import { UserWebtoolService } from '../Services/user-webtool.service';
import { FormsModule } from '@angular/forms';
import { SelectWithSearchComponent } from '../components/select_with_search/select_with_search.component';
import { Router } from '@angular/router';
import { WebtoolUserService } from '../Services/webtool-user.service';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, finalize, forkJoin, from, map, of, Subject, switchMap, tap } from 'rxjs';
import { HomeService } from '../Services/home.service';
import {   Webtool, 
  WebtoolUser, 
  UserRole, 
  CreateUserWebtoolDto,  
  WebtoolUserDisplay,
  WebtoolRoleSelection, HeaderOption} from '../../../interfaces/webtool.interfaces';
import { ToastService } from '../Services/toast.service';
import { ConfirmationService } from '../Services/confirmation.service';
import { Pipe, PipeTransform } from '@angular/core';

interface Role {
  id: number;
  roles: string;
  privileges: string;
}
interface WebtoolWithUsers extends Webtool {
  users: WebtoolUserDisplay[];
  totalUsers: number;
}

interface UserWebtool {
  id?: number;
  userId: number;
  webtoolId: number;
  roleId: number;
  user: {
    id: number;
    name: string;
    email: string;
    department?: {
      department: string;
    };
  };
  webtool: {
    id: number;
    webtool: string;
  };
  role?: {
    id: number;
    roles: string;
    privileges: string;
  };
}

@Pipe({
  name: 'filterUsers'
})
export class FilterUsersPipe implements PipeTransform {
  transform(users: WebtoolUserDisplay[], active: boolean, searchTerm: string = ''): WebtoolUserDisplay[] {
    if (!users) return [];
    
    // Filter by active status first
    let filtered = users.filter(user => user.isActive === active);
    
    // Then apply search filter if there's a search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.userName.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term) || 
        user.department.toLowerCase().includes(term))
    }
    
    return filtered;
  }
}

@Component({
  selector: 'app-webtools',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectWithSearchComponent, FilterUsersPipe],
  providers: [UserService],
  templateUrl: './webtools.component.html'
})
export class WebtoolsComponent implements OnInit {
  webtools: WebtoolWithUsers[] = [];
  filteredWebtools: WebtoolWithUsers[] = []; 
  users: WebtoolUserDisplay[] = [];
  showForm = false;
  selectedWebtool: Webtool | null = null;
  viewMode: 'webtool' | 'matrix' | 'users' = 'webtool';
  searchTerm: string = '';
  
  originalUsers: WebtoolUserDisplay[] = [];
  activeUsersTab = true;

  userOptions: HeaderOption[] = [];
  roleOptions: HeaderOption[] = [];
  selectedRoles: UserRole[] = [];

//New one
  webtoolRoleSelections: WebtoolRoleSelection[] = [];

  expandedWebtoolId: number | null = null;

  
  isEditMode = false;
  selectedWebtools: string[] = [];
  webtoolOptions: HeaderOption[] = [];
  records: any[] = [];

  searchTerm$ = new Subject<string>();
  adUsers: any[] = [];
  isSearching = false;

  editForm = {
    userId: null as number | null,
    userName: '',
    email: '',
    department: '',
    webtools: [] as string[],
    isActive: true // Add this
  };

  toolHeaders = [
    { name: 'actions', display_name: 'Actions', width: '10%' },
    { name: 'webtool', display_name: 'Web Tool', width: '70%' },
    { name: 'totalUsers', display_name: 'Total Users', width: '20%' }
  ];

  userHeaders = [
    { name: 'actions', display_name: 'Actions', width: '10%' },
    { name: 'userName', display_name: 'User', width: '25%' },
    { name: 'email', display_name: 'Email', width: '30%' },
    { name: 'department', display_name: 'Department', width: '15%' },
    { name: 'role', display_name: 'Role', width: '20%' }
  ];

  userViewHeaders = [
    { name: 'actions', display_name: 'Actions', width: '10%' },
    { name: 'userName', display_name: 'User', width: '25%' },
    { name: 'department', display_name: 'Department', width: '15%' },
    { name: 'email', display_name: 'Email', width: '20%' },
    { name: 'isActive', display_name: 'Status', width: '15%' }, // New column
    { name: 'webtools', display_name: 'Webtools', width: '15%' }
  ];


  constructor(
    private webtoolService: WebtoolService,
    private userService: UserService,
    private roleService: RolesService,
    private userWebtoolService: UserWebtoolService,
    private router: Router,
    private webtoolUserService: WebtoolUserService,
    private homeService: HomeService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {
    this.setupADSearch();
  }

  private setupADSearch() {
    {
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
  }



  ngOnInit() {
    this.loadWebTools();
    this.loadRecords();
    this.loadUsersView();
    this.loadWebtoolOptions();
  }

  // onWebtoolChange(webtool: string) {
  //   if (!this.selectedWebtools.includes(webtool)) {
  //     this.selectedWebtools.push(webtool);
  //   }
  // }

  // onWebtoolChange(webtool: string) {
  //   const selectedWebtool = this.webtoolOptions.find(w => w.value === webtool);
  //   if (selectedWebtool && !this.webtoolRoleSelections.some(w => w.webtoolId === +selectedWebtool.id)) {
  //     // Load roles for this webtool
  //     this.roleService.getRolesByWebtool(selectedWebtool.id).subscribe({
  //       next: (roles) => {
  //         this.webtoolRoleSelections.push({
  //           webtoolId: selectedWebtool.id,
  //           webtoolName: selectedWebtool.value,
  //           selectedRoles: [],
  //           availableRoles: roles
  //         });
  //       },
  //       error: (error) => console.error('Error loading roles:', error)
  //     });
  //   }
  // }

  onWebtoolChange(webtool: string) {
    const selectedWebtool = this.webtoolOptions.find(w => w.value === webtool);
    if (selectedWebtool && !this.webtoolRoleSelections.some(w => w.webtoolId === +selectedWebtool.id)) {
      // Load roles for this webtool
      this.roleService.getRolesByWebtool(selectedWebtool.id).subscribe({
        next: (roles) => {
          const mappedRoles = roles.map(r => ({
            id: r.id,
            value: r.roles,
            label: r.roles,
            privileges: r.privileges
          }));
          
          this.webtoolRoleSelections.push({
            webtoolId: selectedWebtool.id,
            webtoolName: selectedWebtool.value,
            selectedRoles: [],
            availableRoles: mappedRoles
          });
        },
        error: (error) => console.error('Error loading roles:', error)
      });
    }
  }

  removeSelectedWebtool(webtool: string) {
    this.selectedWebtools = this.selectedWebtools.filter(w => w !== webtool);
  }
  openAddRecordForm() {
    this.showForm = true;
    this.isEditMode = false;
    this.resetForm();
  }

  // openForm(mode: 'add' | 'edit', record?: any, index?: number) {
  //   if (mode === 'add') {
  //     this.isEditMode = false;
  //     this.resetForm();
  //   } else {
  //     this.isEditMode = true;
  //     if (record) {
  //       this.editForm = {
  //         userId: record.userId,
  //         userName: record.userName,
  //         email: record.email,
  //         department: record.department,
  //         webtools: record.webtools || []
  //       };
  //       this.selectedWebtools = [...(record.webtools || [])];
  //     }
  //   }
  //   this.showForm = true;
  // }

  closeForm() {
    this.showForm = false;
    this.selectedWebtool = null;
    this.isEditMode = false;
    this.resetForm();
  }

  // private resetForm() {
  //   this.editForm = {
  //     userId: null,
  //     userName: '',
  //     email: '',
  //     department: '',
  //     webtools: []
  //   };
  //   this.selectedWebtools = [];
  //   this.selectedRoles = [];  // Add this line
  //   this.webtoolRoleSelections = [];  // Add this line
  // }


  private resetForm() {
    this.editForm = {
      userId: null,
      userName: '',
      email: '',
      department: '',
      webtools: [],
      isActive: true // Add this
    };
    this.selectedRoles = [];
    this.webtoolRoleSelections = [];
    // Do NOT reset selectedWebtool here as it's needed for the add operation
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
    console.log('Raw AD user:', user);
    
    this.editForm = {
      userId: null,
      userName: user.name,
      email: user.email,
      department: user.department,
      webtools: this.selectedWebtools,
      isActive: true 
    };
    this.adUsers = [];
  }
  loadWebTools() {
    this.webtoolService.getWebtools().subscribe({
      next: (webtools) => {
        const webtoolPromises = webtools.map(async tool => {
          try {
            const roles = await this.roleService.getRolesByWebtool(tool.id).toPromise();
            return {
              ...tool,
              isExpanded: false,
              users: [],
              totalUsers: 0,
              roles: roles || []
            };
          } catch (error) {
            console.error(`Error loading roles for webtool ${tool.id}:`, error);
            return {
              ...tool,
              isExpanded: false,
              users: [],
              totalUsers: 0,
              roles: []
            };
          }
        });
  
        Promise.all(webtoolPromises).then(toolsWithRoles => {
          console.log('Loaded webtools with roles:', toolsWithRoles);
          this.webtools = toolsWithRoles;
          this.filteredWebtools = [...this.webtools];
          this.loadUserWebtoolData();
        });
      }
    });
  }
  // loadUsersView() {
  //   this.webtoolUserService.getRecords().subscribe({
  //     next: (users: WebtoolUser[]) => {
  //       console.log('Loaded users:', users);
  //       this.users = users.map(user => ({
  //         userId: user.userId,
  //         userName: user.userName,
  //         email: user.email,
  //         department: user.department,
  //         roles: Object.values(user.roles).flat(),
  //         webtools: user.webtools
  //       }));
  //     },
  //     error: (error) => {
  //       console.error('Error loading users view:', error);
  //       alert('Failed to load users view');
  //     }
  //   });
  // }

  // loadUsersView() {
  //   this.webtoolUserService.getRecords().subscribe({
  //     next: (users: WebtoolUser[]) => {
  //       console.log('Loaded users:', users);
  //       this.users = users.map(user => ({
  //         userId: user.userId,
  //         userName: user.userName,
  //         email: user.email,
  //         department: user.department,
  //         roles: Object.values(user.roles).flat(),
  //         webtools: user.webtools
  //       }));
  //       // Force change detection
  //       this.users = [...this.users];
  //     },
  //     error: (error) => {
  //       console.error('Error loading users view:', error);
  //       this.toastService.show('Failed to load users view', 'error');
  //     }
  //   });
  // }
  loadUsersView() {
    this.webtoolUserService.getRecords().subscribe({
      next: (users: WebtoolUser[]) => {
        console.log('Loaded users:', users);
        this.users = users.map(user => ({
          userId: user.userId,
          userName: user.userName,
          email: user.email,
          department: user.department,
          roles: Object.values(user.roles).flat(),
          webtools: user.webtools,
          // isActive: user.isActive !== undefined ? user.isActive : true, // Default to true if undefined
          isActive: user.isActive ?? false,
          lastActiveAt: user.lastActiveAt
        }));
        console.log("here",Object.values(users[0].roles).flat())

        this.originalUsers = [...this.users]; // Initialize originalUsers
      },
      error: (error) => {
        console.error('Error loading users view:', error);
        this.toastService.show('Failed to load users view', 'error');
      }
    });
  }
  loadWebtoolOptions() {
    this.webtoolService.getWebtools().subscribe({
      next: (webtools) => {
        this.webtoolOptions = webtools.map(webtool => ({
          id: webtool.id,
          value: webtool.webtool,
          label: webtool.webtool
        }));
      },
      error: (error) => console.error('Error loading webtool options:', error)
    });
  }
  loadUserWebtoolData() {
    console.log('Loading user webtool data...');
    this.userWebtoolService.getConsolidatedUserData().pipe(
      tap(users => console.log('Raw user data:', users))
    ).subscribe({
      next: (users) => {
        console.log('Processing consolidated user data:', users);
        
        this.webtools = this.webtools.map(tool => {
          console.log(`Processing webtool ${tool.webtool}`);
          
          const toolUsers = users.filter(user => {
            if (!user.webtools || !Array.isArray(user.webtools)) {
              console.log(`No webtools array for user ${user.userName}`);
              return false;
            }
  
            const hasWebtool = user.webtools.some(wt => 
              wt.toLowerCase().trim() === tool.webtool.toLowerCase().trim()
            );
            
            console.log(`User ${user.userName} has webtool ${tool.webtool}:`, hasWebtool);
            return hasWebtool;
          }).map(user => {
            const userRoles = user.roles[tool.id] || [];
            console.log(`Roles for user ${user.userName}:`, userRoles);
            
            return {
              userId: user.userId,
              userName: user.userName,
              email: user.email,
              department: user.department,
              roles: userRoles,
              webtools: user.webtools,
              isActive: user.isActive !== undefined ? user.isActive : true,
              lastActiveAt: user.lastActiveAt
            };
          });
  
          console.log(`Found ${toolUsers.length} users for ${tool.webtool}:`, toolUsers);
  
          return {
            ...tool,
            users: toolUsers,
            totalUsers: toolUsers.length
          };
        });
  
        this.webtools = [...this.webtools];
        this.filteredWebtools = [...this.webtools];
      },
      error: (error) => {
        console.error('Error loading user webtool data:', error);
      }
    });
  }
  // onSave() {
  //   if (!this.editForm.email) {
  //     alert('Please select a user');
  //     return;
  //   }
  
  //   if (this.viewMode === 'matrix') {
  //     console.log('Matrix view save');
  //     if (this.selectedRoles.length === 0) {
  //       alert('Please select at least one role');
  //       return;
  //     }
      
  //   } else {
  //     console.log('User view save');
  //     if (this.selectedWebtools.length === 0) {
  //       alert('Please select at least one webtool');
  //       return;
  //     }
  
  //     if (this.isEditMode) {
  //       this.updateExistingAssignments();
  //     } else {
  //       this.createNewAssignments();
  //     }
  //   }
  // }

  // onSave() {
  //   if (this.viewMode === 'matrix') {
  //     this.saveMatrixAssignment();
  //   } else {
  //     // User view save logic
  //     if (!this.editForm.email || this.webtoolRoleSelections.length === 0) {
  //       alert('Please select user and at least one webtool');
  //       return;
  //     }
  
  //     if (this.webtoolRoleSelections.some(w => w.selectedRoles.length === 0)) {
  //       alert('Please select at least one role for each webtool');
  //       return;
  //     }
  
  //     const createPromises = this.webtoolRoleSelections.flatMap(selection => 
  //       selection.selectedRoles.map(role => {
  //         const dto: CreateUserWebtoolDto = {
  //           email: this.editForm.email,
  //           userName: this.editForm.userName,
  //           department: this.editForm.department,
  //           webtoolId: selection.webtoolId,
  //           roleId: role.id
  //         };
  //         return this.userWebtoolService.createUserWebtool(dto).toPromise();
  //       })
  //     );
  
  //     Promise.all(createPromises)
  //       .then(() => {
  //         this.reloadAllViews();
  //         this.closeForm();
  //       })
  //       .catch(error => {
  //         console.error('Error creating assignments:', error);
  //         alert('Failed to create assignments');
  //       });
  //   }
  // }
  

  // onSave() {
  //   if (this.viewMode === 'matrix') {
  //     this.saveMatrixAssignment();
  //   } else {
  //     // User view save logic
  //     if (!this.editForm.email || this.webtoolRoleSelections.length === 0) {
  //       this.toastService.show('Please select user and at least one webtool', 'warning');
  //       return;
  //     }
  
  //     if (this.webtoolRoleSelections.some(w => w.selectedRoles.length === 0)) {
  //       this.toastService.show('Please select at least one role for each webtool', 'warning');
  //       return;
  //     }
  
  //     // Check if user already exists
  //     this.userWebtoolService.getUserWebtoolsByUser(this.editForm.email).pipe(
  //       map(userWebtools => {
  //         if (userWebtools && userWebtools.length > 0) {
  //           throw new Error('User already exists');
  //         }
  //         return userWebtools;
  //       }),
  //       switchMap(() => {
  //         // Create new assignments if user doesn't exist
  //         const createPromises = this.webtoolRoleSelections.flatMap(selection => 
  //           selection.selectedRoles.map(role => {
  //             const dto: CreateUserWebtoolDto = {
  //               email: this.editForm.email,
  //               userName: this.editForm.userName,
  //               department: this.editForm.department,
  //               webtoolId: selection.webtoolId,
  //               roleId: role.id
  //             };
  //             return this.userWebtoolService.createUserWebtool(dto).toPromise();
  //           })
  //         );
  
  //         return Promise.all(createPromises);
  //       }),
  //       catchError(error => {
  //         if (error.message === 'User already exists') {
  //           this.toastService.show('This user already has webtool assignments', 'error');
  //         } else {
  //           this.toastService.show('Failed to create assignments', 'error');
  //           console.error('Error creating assignments:', error);
  //         }
  //         return EMPTY;
  //       })
  //     ).subscribe({
  //       next: () => {
  //         this.toastService.show('User assignments created successfully', 'success');
  //         this.reloadAllViews();
  //         this.closeForm();
  //       }
  //     });
  //   }
  // }



  // onSave() {
  //   if (this.viewMode === 'matrix') {
  //     this.saveMatrixAssignment();
  //   } else {
  //     // User view save logic
  //     if (!this.editForm.email || this.webtoolRoleSelections.length === 0) {
  //       this.toastService.show('Please select user and at least one webtool', 'warning');
  //       return;
  //     }
  
  //     // Remove any webtools that have no roles selected
  //     this.webtoolRoleSelections = this.webtoolRoleSelections.filter(selection => 
  //       selection.selectedRoles.length > 0
  //     );
  
  //     if (this.webtoolRoleSelections.length === 0) {
  //       this.toastService.show('Please select at least one role for a webtool', 'warning');
  //       return;
  //     }
  
  //     // If editing, first delete existing assignments
  //     if (this.isEditMode) {
  //       this.userWebtoolService.getUserWebtoolsByUser(this.editForm.email).pipe(
  //         switchMap(userWebtools => {
  //           const deletePromises = userWebtools.map(uw => 
  //             this.userWebtoolService.deleteUserWebtool(this.editForm.email, uw.webtoolId)
  //           );
  //           return forkJoin(deletePromises);
  //         }),
  //         switchMap(() => {
  //           // After deleting, create new assignments
  //           const createPromises = this.webtoolRoleSelections.flatMap(selection => 
  //             selection.selectedRoles.map(role => {
  //               const dto: CreateUserWebtoolDto = {
  //                 email: this.editForm.email,
  //                 userName: this.editForm.userName,
  //                 department: this.editForm.department,
  //                 webtoolId: selection.webtoolId,
  //                 roleId: role.id
  //               };
  //               return this.userWebtoolService.createUserWebtool(dto).toPromise();
  //             })
  //           );
  //           return Promise.all(createPromises);
  //         }),
  //         catchError(error => {
  //           this.toastService.show('Failed to update assignments', 'error');
  //           console.error('Error updating assignments:', error);
  //           return EMPTY;
  //         })
  //       ).subscribe({
  //         next: () => {
  //           this.toastService.show('User assignments updated successfully', 'success');
  //           this.reloadAllViews();
  //           this.closeForm();
  //         }
  //       });
  //     } else {
  //       // New user creation - keep existing check
  //       this.userWebtoolService.getUserWebtoolsByUser(this.editForm.email).pipe(
  //         map(userWebtools => {
  //           if (userWebtools && userWebtools.length > 0) {
  //             throw new Error('User already exists');
  //           }
  //           return userWebtools;
  //         }),
  //         switchMap(() => {
  //           const createPromises = this.webtoolRoleSelections.flatMap(selection => 
  //             selection.selectedRoles.map(role => {
  //               const dto: CreateUserWebtoolDto = {
  //                 email: this.editForm.email,
  //                 userName: this.editForm.userName,
  //                 department: this.editForm.department,
  //                 webtoolId: selection.webtoolId,
  //                 roleId: role.id
  //               };
  //               return this.userWebtoolService.createUserWebtool(dto).toPromise();
  //             })
  //           );
  //           return Promise.all(createPromises);
  //         }),
  //         catchError(error => {
  //           if (error.message === 'User already exists') {
  //             this.toastService.show('This user already has webtool assignments', 'error');
  //           } else {
  //             this.toastService.show('Failed to create assignments', 'error');
  //             console.error('Error creating assignments:', error);
  //           }
  //           return EMPTY;
  //         })
  //       ).subscribe({
  //         next: () => {
  //           this.toastService.show('User assignments created successfully', 'success');
  //           this.reloadAllViews();
  //           this.closeForm();
  //         }
  //       });
  //     }
  //   }
  // }





  async onSave() {
    if (this.viewMode === 'matrix') {
      this.saveMatrixAssignment();
      if (this.selectedWebtool) {
        this.expandedWebtoolId = this.selectedWebtool.id;
      }
      return;
    }
  
    // 1. Validation
    if (!this.editForm.email || this.webtoolRoleSelections.length === 0) {
      this.toastService.show('Please select user and at least one webtool', 'warning');
      return;
    }
  
    try {
      console.log('Saving with isActive:', this.editForm.isActive);
  
      // 2. Get current assignments first (for cleanup)
      const userWebtools = await this.userWebtoolService.getUserWebtoolsByUser(this.editForm.email)
        .pipe(tap(assignments => console.log('Current assignments:', assignments)))
        .toPromise();
  
      if (userWebtools?.length) {
        // 3. Delete existing assignments
        await Promise.all(
          userWebtools.map(uw => {
            console.log(`Deleting assignment for webtool ${uw.webtoolId}`);
            return this.userWebtoolService.deleteUserWebtool(this.editForm.email, uw.webtoolId).toPromise();
          })
        );
      }
  
      // 4. Create new assignments with correct isActive status
      const createPromises = this.webtoolRoleSelections.flatMap(selection => 
        selection.selectedRoles.map(role => {
          const dto: CreateUserWebtoolDto = {
            email: this.editForm.email,
            userName: this.editForm.userName,
            department: this.editForm.department,
            webtoolId: selection.webtoolId,
            roleId: role.id,
            isActive: this.editForm.isActive // Explicitly pass the status
          };
          console.log('Creating assignment with:', dto);
          return this.userWebtoolService.createUserWebtool(dto).toPromise();
        })
      );
  
      await Promise.all(createPromises);
  
      // 5. Force refresh data
      this.loadUsersView();
      this.loadUserWebtoolData();
      
      this.toastService.show('Changes saved successfully', 'success');
      this.closeForm();
    } catch (error) {
      console.error('Error in onSave:', error);
      this.toastService.show('Failed to save changes. Please try again.', 'error');
      // Rollback - reload original data
      this.loadUsersView();
      this.loadUserWebtoolData();
    }
  }
  // private saveMatrixAssignment() {
  //   if (!this.editForm.email || !this.selectedWebtool || this.selectedRoles.length === 0) {
  //     alert('Please select a user and at least one role');
  //     return;
  //   }
  
  //   const createPromises = this.selectedRoles.map(role => {
  //     const dto: CreateUserWebtoolDto = {
  //       email: this.editForm.email,
  //       userName: this.editForm.userName,
  //       department: this.editForm.department,
  //       webtoolId: this.selectedWebtool!.id,
  //       roleId: role.id
  //     };
  //     return this.userWebtoolService.createUserWebtool(dto).toPromise();
  //   });
  
  //   Promise.all(createPromises)
  //     .then(() => {
  //       this.reloadAllViews();
  //       this.closeForm();
  //     })
  //     .catch(error => {
  //       console.error('Error creating assignments:', error);
  //       alert('Failed to create assignments');
  //     });
  // }


  // private saveMatrixAssignment() {
  //   if (!this.editForm.email || !this.selectedWebtool || this.selectedRoles.length === 0) {
  //     this.toastService.show('Please select a user and at least one role', 'warning');
  //     return;
  //   }
  
  //   this.userWebtoolService.getUserWebtoolsByUser(this.editForm.email).pipe(
  //     map(userWebtools => {
  //       // Check if user exists in THIS specific webtool
  //       const existingAssignment = userWebtools.find(uw => 
  //         uw.webtoolId === this.selectedWebtool!.id
  //       );
  //       if (existingAssignment) {
  //         throw new Error('User already exists in this webtool');
  //       }
  //       return userWebtools;
  //     }),
  //     switchMap(() => {
  //       const createPromises = this.selectedRoles.map(role => {
  //         const dto: CreateUserWebtoolDto = {
  //           email: this.editForm.email,
  //           userName: this.editForm.userName,
  //           department: this.editForm.department,
  //           webtoolId: this.selectedWebtool!.id,
  //           roleId: role.id
  //         };
  //         return this.userWebtoolService.createUserWebtool(dto).toPromise();
  //       });
  
  //       return from(Promise.all(createPromises));
  //     }),
  //     catchError(error => {
  //       if (error.message === 'User already exists in this webtool') {
  //         this.toastService.show('This user already has access to this webtool', 'error');
  //       } else {
  //         this.toastService.show('Failed to create assignments', 'error');
  //         console.error('Error creating assignments:', error);
  //       }
  //       return EMPTY;
  //     })
  //   ).subscribe({
  //     next: () => {
  //       this.toastService.show('User assignments created successfully', 'success');
  //       this.reloadAllViews();
  //       this.closeForm();
  //     }
  //   });
  // }

  private saveMatrixAssignment() {
    console.log('Saving matrix assignment with:', {
      email: this.editForm.email,
      selectedWebtool: this.selectedWebtool,
      selectedRoles: this.selectedRoles
    });
  
    // Validation check with detailed logging
    if (!this.editForm.email) {
      console.log('Missing email');
      this.toastService.show('Please select a user', 'warning');
      return;
    }
  
    if (!this.selectedWebtool) {
      console.log('Missing selected webtool');
      this.toastService.show('No webtool selected', 'warning');
      return;
    }
  
    if (!this.selectedRoles || this.selectedRoles.length === 0) {
      console.log('No roles selected');
      this.toastService.show('Please select at least one role', 'warning');
      return;
    }
  
    if (this.isEditMode) {
      // Edit mode logic...
      this.handleEditMode();
    } else {
      // New assignment logic
      this.handleNewAssignment();
    }
  }

  private handleEditMode() {
    this.userWebtoolService.getUserWebtoolsByUser(this.editForm.email).pipe(
      switchMap(userWebtools => {
        return this.userWebtoolService.deleteUserWebtool(this.editForm.email, this.selectedWebtool!.id).pipe(
          switchMap(() => this.createNewRoleAssignments())
        );
      }),
      catchError(error => {
        console.error('Error in edit mode:', error);
        this.toastService.show('Failed to update assignments', 'error');
        return EMPTY;
      })
    ).subscribe({
      next: () => {
        this.toastService.show('User roles updated successfully', 'success');
        this.reloadAllViews();
        this.closeForm();
      }
    });
  }
  
  private handleNewAssignment() {
    this.userWebtoolService.getUserWebtoolsByUser(this.editForm.email).pipe(
      map(userWebtools => {
        const existingAssignment = userWebtools.find(uw => 
          uw.webtoolId === this.selectedWebtool!.id
        );
        if (existingAssignment) {
          throw new Error('User already exists in this webtool');
        }
        return userWebtools;
      }),
      switchMap(() => this.createNewRoleAssignments()),
      catchError(error => {
        if (error.message === 'User already exists in this webtool') {
          this.toastService.show('This user already has access to this webtool', 'error');
        } else {
          console.error('Error creating assignments:', error);
          this.toastService.show('Failed to create assignments', 'error');
        }
        return EMPTY;
      })
    ).subscribe({
      next: () => {
        this.toastService.show('User assignments created successfully', 'success');
        this.reloadAllViews();
        this.closeForm();
      }
    });
  }
  private createNewRoleAssignments() {
    const createPromises = this.selectedRoles.map(role => {
      const dto: CreateUserWebtoolDto = {
        email: this.editForm.email,
        userName: this.editForm.userName,
        department: this.editForm.department,
        webtoolId: this.selectedWebtool!.id,
        roleId: role.id
      };
      console.log('Creating assignment with dto:', dto);
      return this.userWebtoolService.createUserWebtool(dto).toPromise();
    });
    return from(Promise.all(createPromises));
  }
  // In webtools.component.ts

  private addRoles() {
    if (!this.selectedWebtool) {
      console.error('No webtool selected');
      return;
    }
  
    const userWebtoolData: CreateUserWebtoolDto = {
      email: this.editForm.email,
      userName: this.editForm.userName,
      department: this.editForm.department,
      webtoolId: this.selectedWebtool.id,
      roleId: this.selectedRoles[0].id 
    };
  
    this.userWebtoolService.createUserWebtool(userWebtoolData).subscribe({
      next: (response) => {
        console.log('User-webtool created:', response);
        this.reloadAllViews();
        this.closeForm();
      },
      error: (error) => {
        console.error('Error creating user-webtool:', error);
        alert('Failed to add user to webtool');
      }
    });
  }
  
  // private reloadAllViews() {
  //   this.loadWebTools();
  //   this.loadUserWebtoolData();
  //   setTimeout(() => {
  //     this.webtools = [...this.webtools];
  //     this.filteredWebtools = [...this.webtools];
  //   }, 100);
  // }

  private reloadAllViews() {
  this.loadWebTools();
  this.loadUserWebtoolData();
  setTimeout(() => {
    this.webtools = [...this.webtools];
    this.filteredWebtools = [...this.webtools];
    // Maintain the expansion state
    if (this.expandedWebtoolId) {
      const tool = this.webtools.find(t => t.id === this.expandedWebtoolId);
      if (tool) {
        tool.isExpanded = true;
      }
    }
  }, 100);
}
  private createNewAssignments() {
    console.log('Creating new assignments with:', {
      editForm: this.editForm,
      selectedWebtools: this.selectedWebtools,
      webtools: this.webtools
    });
  
    const assignmentPromises = this.selectedWebtools.map(async webtoolName => {
      const webtool = this.webtools.find(w => w.webtool === webtoolName);
      if (!webtool) {
        console.error(`Webtool not found: ${webtoolName}`);
        return null;
      }
  
      try {
        const roles = await this.roleService.getRolesByWebtool(webtool.id).toPromise();
        if (!roles || roles.length === 0) {
          console.error(`No roles found for webtool: ${webtoolName}`);
          return null;
        }
  
        const userWebtoolData: CreateUserWebtoolDto = {
          email: this.editForm.email,
          userName: this.editForm.userName,
          department: this.editForm.department,
          webtoolId: webtool.id,
          roleId: roles[0].id  
        };
  
        console.log('Creating assignment:', userWebtoolData);
        return userWebtoolData;
      } catch (error) {
        console.error(`Error loading roles for webtool ${webtoolName}:`, error);
        return null;
      }
    });
  
    Promise.all(assignmentPromises)
      .then(assignments => {
        const validAssignments = assignments.filter((a): a is CreateUserWebtoolDto => a !== null);
  
        if (validAssignments.length === 0) {
          alert('No valid assignments could be created. Please ensure webtools have roles assigned.');
          return;
        }
  
        const createPromises = validAssignments.map(assignment =>
          this.userWebtoolService.createUserWebtool(assignment).toPromise()
        );
  
        return Promise.all(createPromises);
      })
      .then(() => {
        console.log('Successfully created all assignments');
        this.reloadAllViews();
        this.closeForm();
      })
      .catch(error => {
        console.error('Error creating assignments:', error);
        alert('Failed to create assignments');
      });
  }
  
  private updateExistingAssignments() {
    if (!this.editForm.email) {
      console.error('No email found:', this.editForm);
      return;
    }
  
    this.userWebtoolService.getUserWebtoolsByUser(this.editForm.email).subscribe({
      next: (userWebtools) => {
        const deletePromises = userWebtools.map(uw => 
          this.userWebtoolService.deleteUserWebtool(this.editForm.email, uw.webtoolId).toPromise()
        );
  
        Promise.all(deletePromises)
          .then(() => {
            this.createNewAssignments();
          })
          .catch(error => {
            console.error('Error deleting existing assignments:', error);
            alert('Failed to update assignments');
          });
      },
      error: (error) => {
        console.error('Error getting user webtools:', error);
        alert('Failed to get existing assignments');
      }
    });
  }
  

  navigateToWebtool(webtool: Webtool) {
    console.log('Navigating to webtool:', webtool);
    this.router.navigate(['/webtool-detail', webtool.id]).then(() => {
      console.log('Navigation complete');
    }).catch(error => {
      console.error('Navigation error:', error);
    });
  }

  toggleView(mode: 'webtool' | 'matrix' | 'users') {
    this.viewMode = mode;
    this.filteredWebtools = [...this.webtools];
  }

  // searchWebtools(event: Event) {
  //   const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
  //   this.filteredWebtools = this.webtools.filter(webtool => {
  //     const webtoolName = webtool.webtool.toLowerCase();
  //     const users = (webtool.users || []).map((user: WebtoolUserDisplay) => user.userName.toLowerCase());
  //     return webtoolName.includes(searchTerm) || 
  //            users.some((name: string) => name.includes(searchTerm));
  //   });
  // }

  searchUsers(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
  
    if (!searchTerm) {
      // Reset to all users if search term is empty
      this.users = [...this.originalUsers];
      return;
    }
  
    // Filter users based on search term
    this.users = this.originalUsers.filter(user => {
      const userName = user.userName.toLowerCase();
      const email = user.email.toLowerCase();
      const department = user.department.toLowerCase();
  
      return userName.includes(searchTerm) || 
             email.includes(searchTerm) || 
             department.includes(searchTerm);
    });
  }

  searchWebtools(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
  
    if (!searchTerm) {
      // Reset to all webtools if search term is empty
      this.filteredWebtools = [...this.webtools];
      return;
    }
  
    // Filter webtools based on search term
    this.filteredWebtools = this.webtools.filter(webtool => {
      const webtoolName = webtool.webtool.toLowerCase();
      const users = (webtool.users || []).map((user: WebtoolUserDisplay) => user.userName.toLowerCase());
  
      // Check if the search term matches either the webtool name or any user name
      return webtoolName.includes(searchTerm) || 
             users.some((name: string) => name.includes(searchTerm));
    });
  }
  // toggleRowExpansion(index: number) {
  //   this.webtools[index].isExpanded = !this.webtools[index].isExpanded;
  // }
  toggleRowExpansion(index: number) {
    const tool = this.webtools[index];
    if (this.expandedWebtoolId === tool.id) {
      this.expandedWebtoolId = null; // Collapse if already expanded
    } else {
      this.expandedWebtoolId = tool.id; // Expand the clicked webtool
    }
  }
  

  //   loadRoles(webtoolId: number) {
  //   this.roleService.getRolesByWebtool(webtoolId).subscribe({
  //     next: (roles) => {
  //       console.log('Loaded roles for webtool:', roles);
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
  loadRoles(webtoolId: number) {
    this.roleService.getRolesByWebtool(webtoolId).subscribe({
      next: (roles) => {
        console.log('Loaded roles for webtool:', roles);
        this.roleOptions = roles.map(role => ({
          id: role.id,
          value: role.roles,
          label: role.roles,
          privileges: role.privileges
        }));
      },
      error: (error) => console.error('Error loading roles:', error)
    });
  }

  // onRoleChange(event: string) {
  //   const selectedRole = this.roleOptions.find(role => role.value === event);
  //   if (selectedRole && !this.selectedRoles.some(r => r.id === selectedRole.id)) {
  //     this.selectedRoles.push({
  //       id: selectedRole.id,
  //       name: selectedRole.value,
  //       privileges: selectedRole.privileges || ''
  //     });
  //   }
  // }
  // onRoleChange(event: string) {
  //   const selectedRole = this.roleOptions.find(role => role.value === event);
  //   if (selectedRole && !this.selectedRoles.some(r => r.id === selectedRole.id)) {
  //     this.selectedRoles.push({
  //       id: selectedRole.id,
  //       name: selectedRole.value,
  //       privileges: selectedRole.privileges || ''
  //     });
  //   }
  // }



  // For Matrix View
// onMatrixRoleChange(event: string) {
//   const selectedRole = this.roleOptions.find(role => role.value === event);
//   if (selectedRole && !this.selectedRoles.some(r => r.id === selectedRole.id)) {
//     this.selectedRoles.push({
//       id: selectedRole.id,
//       name: selectedRole.value,
//       privileges: selectedRole.privileges || ''
//     });
//   }
// }

onMatrixRoleChange(event: string) {
  const selectedRole = this.roleOptions.find(role => role.value === event);
  if (selectedRole && !this.selectedRoles.some(r => r.id === selectedRole.id)) {
    this.selectedRoles.push({
      id: selectedRole.id,
      name: selectedRole.value,
      privileges: selectedRole.privileges || ''
    });
  }
}

// For User View
onUserViewRoleChange(event: string, selection: WebtoolRoleSelection) {
  const selectedRole = selection.availableRoles?.find(role => role.value === event);
  if (selectedRole && !selection.selectedRoles.some(r => r.id === selectedRole.id)) {
    selection.selectedRoles.push({
      id: selectedRole.id,
      name: selectedRole.value,
      privileges: selectedRole.privileges || ''
    });
  }
}

  removeWebtoolSelection(webtoolId: number) {
    this.webtoolRoleSelections = this.webtoolRoleSelections.filter(w => w.webtoolId !== webtoolId);
  }

  // removeSelectedRole(role: UserRole) {
  //   this.selectedRoles = this.selectedRoles.filter(r => r.id !== role.id);
  // }

  removeSelectedRole(role: UserRole) {
    if (this.viewMode === 'users') {
      // Handle user view role removal
      const selection = this.webtoolRoleSelections.find(w => 
        w.selectedRoles.some(r => r.id === role.id)
      );
      if (selection) {
        selection.selectedRoles = selection.selectedRoles.filter(r => r.id !== role.id);
        if (selection.selectedRoles.length === 0) {
          this.webtoolRoleSelections = this.webtoolRoleSelections.filter(w => 
            w.webtoolId !== selection.webtoolId
          );
        }
      }
    } else {
      // Handle matrix/webtool view role removal
      this.selectedRoles = this.selectedRoles.filter(r => r.id !== role.id);
    }
  }
  openUserViewEditForm(mode: 'edit', user: WebtoolUserDisplay) { 
    console.log('Edit clicked for user:', user); 
    if (this.viewMode !== 'users') return;
    
    this.isEditMode = true;
    this.editForm = {
      userId: user.userId,
      userName: user.userName,
      email: user.email,
      department: user.department,
      webtools: user.webtools || [],
      isActive: user.isActive // Directly use the user's isActive status
    };
    
    console.log('Form data with isActive:', this.editForm.isActive);
    
    // Load webtool role selections for this user
    this.loadUserWebtoolRoles(user);
    
    this.showForm = true;
  }
  private loadUserWebtoolRoles(user: WebtoolUserDisplay) {
    this.webtoolRoleSelections = [];
    
    if (user.webtools && user.webtools.length > 0) {
      user.webtools.forEach(webtoolName => {
        const webtool = this.webtoolOptions.find(w => w.value === webtoolName);
        if (webtool) {
          this.roleService.getRolesByWebtool(webtool.id).subscribe({
            next: (roles) => {
              const userRolesForWebtool = user.roles.filter(role => 
                roles.some(r => r.id === role.id)
              );
              
              this.webtoolRoleSelections.push({
                webtoolId: webtool.id,
                webtoolName: webtool.value,
                availableRoles: roles.map(r => ({
                  id: r.id,
                  value: r.roles,
                  label: r.roles,
                  privileges: r.privileges
                })),
                selectedRoles: [...userRolesForWebtool]
              });
            },
            error: (error) => console.error('Error loading roles:', error)
          });
        }
      });
    }
  }


  loadRecords() {
    this.userWebtoolService.getAllUserWebtools().subscribe({
      next: (records) => {
        this.records = records.map(record => ({
          ...record,
          isExpanded: false
        }));
      },
      error: (error) => {
        console.error('Error loading records:', error);
        alert('Failed to load records');
      }
    });
  }
 
  // openAddUserForm(webtool: Webtool) {
  //   this.selectedWebtool = webtool;
  //   this.loadRoles(webtool.id);
  //   this.showForm = true;
  //   this.resetForm();
  //   this.selectedRoles = [];  // Add this line to ensure roles are cleared
  // }

  openAddUserForm(tool: Webtool) {
    console.log('Opening add form for tool:', tool);
    // Make sure we're creating a proper Webtool object
    this.selectedWebtool = {
      id: tool.id,
      webtool: tool.webtool,
      roles: tool.roles,
      isExpanded: tool.isExpanded,
      users: tool.users,
      totalUsers: tool.totalUsers
    };
    
    // Load roles for this webtool
    this.loadRoles(tool.id);
    
    // Reset form state
    this.showForm = true;
    this.isEditMode = false;
    this.resetForm();
    this.selectedRoles = [];
    
    console.log('Selected webtool after setup:', this.selectedWebtool);
  }

  openEditForm(mode: 'edit', user: WebtoolUserDisplay) { 
    this.isEditMode = true;
    this.editForm = {
      userId: user.userId,
      userName: user.userName,
      email: user.email,
      department: user.department,
      webtools: user.webtools || [],
      isActive: user.isActive !== undefined ? user.isActive : true
    };
    this.selectedWebtools = [...(user.webtools || [])];
    this.showForm = true;
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


  // deleteUserRecord(user: WebtoolUserDisplay) {
  //   if (confirm('Are you sure you want to delete this user\'s access to all webtools?')) {
  //     this.userWebtoolService.getUserWebtoolsByUser(user.email).pipe(
  //       map((userWebtools: any[]) => userWebtools as UserWebtool[])
  //     ).subscribe(
  //       userWebtools => {
  //         const deletePromises = userWebtools.map(uw => 
  //           this.userWebtoolService.deleteUserWebtool(user.email, uw.webtoolId).toPromise()
  //         );
          
  //         Promise.all(deletePromises).then(() => {
  //           this.reloadAllViews();
  //         });
  //       },
  //       error => {
  //         console.error('Error deleting user record:', error);
  //         alert('Failed to delete user record');
  //       }
  //     );
  //   }
  // }
  // deleteUserRecord(user: WebtoolUserDisplay) {
  //   if (confirm('Are you sure you want to delete this user\'s access to all webtools?')) {
  //     this.userWebtoolService.getUserWebtoolsByUser(user.email).pipe(
  //       switchMap(userWebtools => {
  //         if (!userWebtools.length) {
  //           throw new Error('No webtools found for this user');
  //         }
          
  //         const deleteObservables = userWebtools.map(uw => 
  //           this.userWebtoolService.deleteUserWebtool(user.email, uw.webtoolId)
  //         );
          
  //         return forkJoin(deleteObservables);
  //       }),
  //       catchError(error => {
  //         console.error('Error in deletion process:', error);
  //         this.toastService.show('Failed to delete user record', 'error');
  //         return EMPTY;
  //       })
  //     ).subscribe(() => {
  //       this.toastService.show('User record deleted successfully', 'success');
  //       this.reloadAllViews();
  //     });
  //   }
  // }





  // For webtool view
  deleteUserRecord(user: WebtoolUserDisplay) {
    this.confirmationService.show(
      'Delete User Access',
      'Are you sure you want to remove this user from all webtools? This action cannot be undone.',
      () => {
        this.userWebtoolService.getUserWebtoolsByUser(user.email).pipe(
          switchMap(userWebtools => {
            if (!userWebtools.length) {
              throw new Error('No webtools found for this user');
            }
            
            const deleteObservables = userWebtools.map(uw => 
              this.userWebtoolService.deleteUserWebtool(user.email, uw.webtoolId)
            );
            
            return forkJoin(deleteObservables);
          }),
          catchError(error => {
            console.error('Error in deletion process:', error);
            this.toastService.show('Failed to delete user record', 'error');
            return EMPTY;
          }),
          // Add finalize to ensure cleanup happens whether there's an error or success
          finalize(() => {
            // Reload all necessary data
            this.loadWebTools();
            this.loadUsersView();
            this.loadUserWebtoolData();
          })
        ).subscribe({
          next: () => {
            // Update the users array directly
            this.users = this.users.filter(u => u.email !== user.email);
            this.toastService.show('User record deleted successfully', 'success');
          }
        });
      }
    );
  }
  // deleteUserWebtool(user: WebtoolUserDisplay, webtoolId: number) {
  //   if (confirm('Are you sure you want to remove this user from the webtool?')) {
  //     this.userWebtoolService.deleteUserWebtool(user.email, webtoolId).subscribe({
  //       next: () => {
  //         this.reloadAllViews(); 
  //       },
  //       error: (error) => {
  //         console.error('Error deleting user-webtool:', error);
  //         alert('Failed to remove user from webtool');
  //       }
  //     });
  //   }
  // }
  





  deleteUserWebtool(user: WebtoolUserDisplay, webtoolId: number) {
    this.confirmationService.show(
      'Remove User Access',
      'Are you sure you want to remove this user from the webtool?',
      () => {
        this.userWebtoolService.deleteUserWebtool(user.email, webtoolId).subscribe({
          next: () => {
            this.reloadAllViews();
            this.toastService.show('User removed from webtool successfully', 'success');
          },
          error: (error) => {
            console.error('Error deleting user-webtool:', error);
            this.toastService.show('Failed to remove user from webtool', 'error');
          }
        });
      }
    );
  }

  



  // removeRole(user: WebtoolUserDisplay, webtoolId: number, roleId: number) {
  //   this.userWebtoolService.deleteUserWebtoolRole(user.email, webtoolId, roleId).subscribe({
  //     next: () => {
  //       this.reloadAllViews();
  //     },
  //     error: (error) => console.error('Error removing role:', error)
  //   });
  // }

  // In webtools.component.ts
// removeRole(webtoolId: number, role: UserRole) {
//   const selection = this.webtoolRoleSelections.find(w => w.webtoolId === webtoolId);
//   if (selection) {
//     selection.selectedRoles = selection.selectedRoles.filter(r => r.id !== role.id);
//   }
// }


removeRole(webtoolId: number, role: UserRole) {
  const selection = this.webtoolRoleSelections.find(w => w.webtoolId === webtoolId);
  if (selection) {
    selection.selectedRoles = selection.selectedRoles.filter(r => r.id !== role.id);
    
    // If no roles left, remove the webtool entirely
    if (selection.selectedRoles.length === 0) {
      this.webtoolRoleSelections = this.webtoolRoleSelections.filter(w => 
        w.webtoolId !== webtoolId
      );
    }
  }
}
















openForm(mode: 'add' | 'edit', record?: any, index?: number) {
  if (this.viewMode === 'matrix') {
    this.openMatrixForm(mode, record, index);
  } else if (this.viewMode === 'users') {
    this.openUserViewForm(mode, record);
  } else if (this.viewMode === 'webtool') {
    this.openWebtoolForm(mode, record);
  }
}

// Matrix View Form Handler
private openMatrixForm(mode: 'add' | 'edit', record?: any, index?: number) {
  this.isEditMode = mode === 'edit';
  if (mode === 'edit' && record) {
    this.editForm = {
      userId: record.userId,
      userName: record.userName,
      email: record.email,
      department: record.department,
      webtools: record.webtools || [],
      isActive: record.isActive !== undefined ? record.isActive : true // Add this

    };

    // Important: Get the currently expanded webtool
    const expandedWebtool = this.webtools.find(w => w.isExpanded);
    
    if (expandedWebtool) {
      console.log('Found expanded webtool:', expandedWebtool);
      this.selectedWebtool = expandedWebtool;
      
      // Load roles for the expanded webtool
      this.roleService.getRolesByWebtool(expandedWebtool.id).subscribe({
        next: (roles) => {
          console.log('Loaded roles for expanded webtool:', roles);
          
          // Map all available roles
          this.roleOptions = roles.map(role => ({
            id: role.id,
            value: role.roles,
            label: role.roles,
            privileges: role.privileges
          }));

          // Set the previously selected roles from the record
          if (record.roles) {
            this.selectedRoles = record.roles.map((role: UserRole) => ({
              id: role.id,
              name: role.name,
              privileges: role.privileges
            }));
          }
          
          console.log('Set roleOptions:', this.roleOptions);
          console.log('Set selectedRoles:', this.selectedRoles);
        },
        error: (error) => {
          console.error('Error loading roles:', error);
          this.toastService.show('Failed to load roles', 'error');
        }
      });
    } else {
      console.error('No expanded webtool found');
      this.toastService.show('Error: Could not find the selected webtool', 'error');
    }
  } else {
    this.resetForm();
  }
  this.showForm = true;
}
// User View Form Handler
private openUserViewForm(mode: 'add' | 'edit', user?: WebtoolUserDisplay) {
  this.isEditMode = mode === 'edit';
  if (mode === 'edit' && user) {
    this.editForm = {
      userId: user.userId,
      userName: user.userName,
      email: user.email,
      department: user.department,
      webtools: user.webtools || [],
      isActive: user.isActive 
    };

    // Load and set existing webtool-role combinations
    this.webtoolRoleSelections = [];
    user.webtools?.forEach(webtoolName => {
      const webtool = this.webtoolOptions.find(w => w.value === webtoolName);
      if (webtool) {
        this.roleService.getRolesByWebtool(webtool.id).subscribe({
          next: (roles) => {
            const mappedRoles = roles.map(r => ({
              id: r.id,
              value: r.roles,
              label: r.roles,
              privileges: r.privileges
            }));

            // Find user's roles for this webtool
            const userRolesForWebtool = user.roles?.filter(role => {
              return roles.some(r => r.id === role.id);
            });

            const selection: WebtoolRoleSelection = {
              webtoolId: webtool.id,
              webtoolName: webtool.value,
              availableRoles: mappedRoles,
              selectedRoles: userRolesForWebtool?.map(role => ({
                id: role.id,
                name: role.name,
                privileges: role.privileges
              })) || []
            };

            this.webtoolRoleSelections.push(selection);
          },
          error: (error) => console.error('Error loading roles:', error)
        });
      }
    });
  } else {
    this.resetForm();
  }
  this.showForm = true;
}

// Webtool View Form Handler
private openWebtoolForm(mode: 'add' | 'edit', record?: any) {
  this.isEditMode = mode === 'edit';
  if (mode === 'edit' && record) {
    this.editForm = {
      userId: record.userId,
      userName: record.userName,
      email: record.email,
      department: record.department,
      webtools: [record.webtool],
      isActive: record.isActive !== undefined ? record.isActive : true // Add this
    };

    // Load roles for the webtool
    this.roleService.getRolesByWebtool(record.id).subscribe({
      next: (roles) => {
        this.roleOptions = roles.map((role: Role) => ({
          id: role.id,
          value: role.roles,
          label: role.roles,
          privileges: role.privileges
        }));

        if (record.roles) {
          this.selectedRoles = record.roles.map((role: Role) => ({
            id: role.id,
            name: role.roles,
            privileges: role.privileges
          }));
        }
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.toastService.show('Failed to load roles', 'error');
      }
    });
  } else {
    this.resetForm();
  }
  this.showForm = true;
}


}