import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { DepartmentComponent } from "../department/department.component";
import { TypeComponent } from "../type/type.component";
import { ValuetypeComponent } from "../valuetype/valuetype.component";
import { WebtoolComponent } from "../webtool/webtool.component";
import { RolesComponent } from "../roles/roles.component";
import { WorkspaceComponent } from "../workspace/workspace.component";
import { DashboardComponent } from "../dashboard/dashboard.component";
import { UserComponent } from "../user/user.component";
import { DepartmentService } from '../../Services/department.service';
import { HttpClient, HttpClientModule, provideHttpClient } from '@angular/common/http';
import { GroupComponent } from '../group/group.component';
import { UserManagementComponent } from '../user-management/user-management.component';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-frame',
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, DepartmentComponent, TypeComponent, ValuetypeComponent, WebtoolComponent, RolesComponent, WorkspaceComponent, DashboardComponent, GroupComponent,UserManagementComponent],
  templateUrl: './frame.component.html',
  providers: [DepartmentService],
  styleUrl: './frame.component.css'
})
export class FrameComponent {




  openTab = 1;
  toggleTabs($tabNumber: number){
    this.openTab = $tabNumber;
  }
}
