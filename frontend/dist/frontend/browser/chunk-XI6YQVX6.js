import {
  DatePipe,
  DecimalPipe,
  HttpClient,
  HttpParams,
  environment
} from "./chunk-JJLF45M2.js";
import {
  Component,
  Injectable,
  computed,
  effect,
  inject,
  input,
  output,
  setClassMetadata,
  signal,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdeclareLet,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinject,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵreadContextLet,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstoreLet,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2
} from "./chunk-V5V2WZJ4.js";
import "./chunk-WDMUDEB6.js";

// src/app/features/analytics/services/analytics-api.service.ts
var BASE = `${environment.apiUrl}api/analytics/engagement`;
var AnalyticsApiService = class _AnalyticsApiService {
  http;
  constructor(http) {
    this.http = http;
  }
  /** KPI overview for the period. */
  getOverview(query) {
    return this.http.get(`${BASE}/overview`, { params: this.toParams(query) });
  }
  /** Per-dashboard engagement rollup. */
  getDashboards(query) {
    return this.http.get(`${BASE}/dashboards`, { params: this.toParams(query) });
  }
  /** Per-report Power BI audit rollup. */
  getReports(query) {
    return this.http.get(`${BASE}/reports`, { params: this.toParams(query) });
  }
  /** All users with engaged time + view totals. */
  getUsers(query) {
    return this.http.get(`${BASE}/users`, { params: this.toParams(query) });
  }
  /** Single-user detail (sessions + views + audit). */
  getUserDetail(userId, query) {
    return this.http.get(`${BASE}/users/${encodeURIComponent(userId)}`, {
      params: this.toParams(query)
    });
  }
  /** Top components by view count, optionally filtered by type. */
  getTopViews(query, type, limit = 20) {
    let params = this.toParams(query).set("limit", String(limit));
    if (type)
      params = params.set("type", type);
    return this.http.get(`${BASE}/views/top`, { params });
  }
  /** Components viewed by a single user. */
  getViewsByUser(userId, query) {
    return this.http.get(`${BASE}/views/by-user/${encodeURIComponent(userId)}`, { params: this.toParams(query) });
  }
  /** Users who viewed a single component. */
  getViewsByComponent(type, id) {
    return this.http.get(`${BASE}/views/by-component/${encodeURIComponent(type)}/${encodeURIComponent(id)}`);
  }
  toParams(query) {
    let params = new HttpParams();
    if (query.period)
      params = params.set("period", query.period);
    if (query.department)
      params = params.set("department", query.department);
    return params;
  }
  static \u0275fac = function AnalyticsApiService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AnalyticsApiService)(\u0275\u0275inject(HttpClient));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _AnalyticsApiService, factory: _AnalyticsApiService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AnalyticsApiService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], () => [{ type: HttpClient }], null);
})();

// src/app/shared/components/period-filter/period-filter.component.ts
function PeriodFilterComponent_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 2);
    \u0275\u0275listener("click", function PeriodFilterComponent_For_2_Template_button_click_0_listener() {
      const p_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.select.emit(p_r2));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const p_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classProp("active", p_r2 === ctx_r2.value());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", p_r2, " ");
  }
}
var PeriodFilterComponent = class _PeriodFilterComponent {
  value = input("30d");
  select = output();
  periods = ["7d", "30d", "90d"];
  static \u0275fac = function PeriodFilterComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _PeriodFilterComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PeriodFilterComponent, selectors: [["app-period-filter"]], inputs: { value: [1, "value"] }, outputs: { select: "select" }, decls: 3, vars: 0, consts: [["role", "group", "aria-label", "Period", 1, "period-filter"], ["type", "button", 1, "period-btn", 3, "active"], ["type", "button", 1, "period-btn", 3, "click"]], template: function PeriodFilterComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0);
      \u0275\u0275repeaterCreate(1, PeriodFilterComponent_For_2_Template, 2, 3, "button", 1, \u0275\u0275repeaterTrackByIdentity);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.periods);
    }
  }, styles: ["\n\n.period-filter[_ngcontent-%COMP%] {\n  display: inline-flex;\n  border: 1px solid #d0d5dd;\n  border-radius: 8px;\n  overflow: hidden;\n}\n.period-btn[_ngcontent-%COMP%] {\n  padding: 6px 14px;\n  background: #fff;\n  border: none;\n  cursor: pointer;\n  font-size: 13px;\n  color: #475467;\n}\n.period-btn[_ngcontent-%COMP%]    + .period-btn[_ngcontent-%COMP%] {\n  border-left: 1px solid #d0d5dd;\n}\n.period-btn.active[_ngcontent-%COMP%] {\n  background: #2563eb;\n  color: #fff;\n  font-weight: 600;\n}\n/*# sourceMappingURL=period-filter.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PeriodFilterComponent, [{
    type: Component,
    args: [{ selector: "app-period-filter", standalone: true, template: `
    <div class="period-filter" role="group" aria-label="Period">
      @for (p of periods; track p) {
        <button
          type="button"
          class="period-btn"
          [class.active]="p === value()"
          (click)="select.emit(p)"
        >
          {{ p }}
        </button>
      }
    </div>
  `, styles: ["/* angular:styles/component:css;e3b56eb72f613aeb434f726bd5a60269bd19b5b2e819fd7085dd074491a1c3b3;/Users/pavithrameddaduwage/Downloads/Access Tool/user_access_tool/frontend/src/app/shared/components/period-filter/period-filter.component.ts */\n.period-filter {\n  display: inline-flex;\n  border: 1px solid #d0d5dd;\n  border-radius: 8px;\n  overflow: hidden;\n}\n.period-btn {\n  padding: 6px 14px;\n  background: #fff;\n  border: none;\n  cursor: pointer;\n  font-size: 13px;\n  color: #475467;\n}\n.period-btn + .period-btn {\n  border-left: 1px solid #d0d5dd;\n}\n.period-btn.active {\n  background: #2563eb;\n  color: #fff;\n  font-weight: 600;\n}\n/*# sourceMappingURL=period-filter.component.css.map */\n"] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PeriodFilterComponent, { className: "PeriodFilterComponent", filePath: "src/app/shared/components/period-filter/period-filter.component.ts", lineNumber: 31 });
})();

// src/app/shared/components/department-filter/department-filter.component.ts
function DepartmentFilterComponent_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 2);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const d_r1 = ctx.$implicit;
    \u0275\u0275property("value", d_r1);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(d_r1);
  }
}
var DepartmentFilterComponent = class _DepartmentFilterComponent {
  departments = input([]);
  value = input(null);
  select = output();
  onChange(event) {
    const v = event.target.value;
    this.select.emit(v === "" ? null : v);
  }
  static \u0275fac = function DepartmentFilterComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DepartmentFilterComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DepartmentFilterComponent, selectors: [["app-department-filter"]], inputs: { departments: [1, "departments"], value: [1, "value"] }, outputs: { select: "select" }, decls: 5, vars: 1, consts: [["aria-label", "Department", 1, "dept-filter", 3, "change", "value"], ["value", ""], [3, "value"]], template: function DepartmentFilterComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "select", 0);
      \u0275\u0275listener("change", function DepartmentFilterComponent_Template_select_change_0_listener($event) {
        return ctx.onChange($event);
      });
      \u0275\u0275elementStart(1, "option", 1);
      \u0275\u0275text(2, "All departments");
      \u0275\u0275elementEnd();
      \u0275\u0275repeaterCreate(3, DepartmentFilterComponent_For_4_Template, 2, 2, "option", 2, \u0275\u0275repeaterTrackByIdentity);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      let tmp_0_0;
      \u0275\u0275property("value", (tmp_0_0 = ctx.value()) !== null && tmp_0_0 !== void 0 ? tmp_0_0 : "");
      \u0275\u0275advance(3);
      \u0275\u0275repeater(ctx.departments());
    }
  }, styles: ["\n\n.dept-filter[_ngcontent-%COMP%] {\n  padding: 6px 12px;\n  border: 1px solid #d0d5dd;\n  border-radius: 8px;\n  font-size: 13px;\n  color: #475467;\n  background: #fff;\n  min-width: 160px;\n}\n/*# sourceMappingURL=department-filter.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DepartmentFilterComponent, [{
    type: Component,
    args: [{ selector: "app-department-filter", standalone: true, template: `
    <select
      class="dept-filter"
      [value]="value() ?? ''"
      (change)="onChange($event)"
      aria-label="Department"
    >
      <option value="">All departments</option>
      @for (d of departments(); track d) {
        <option [value]="d">{{ d }}</option>
      }
    </select>
  `, styles: ["/* angular:styles/component:css;c3ca1f7219db2461a22c9245e7f4a720369e48d4250a8ce0b49f06eab2f57163;/Users/pavithrameddaduwage/Downloads/Access Tool/user_access_tool/frontend/src/app/shared/components/department-filter/department-filter.component.ts */\n.dept-filter {\n  padding: 6px 12px;\n  border: 1px solid #d0d5dd;\n  border-radius: 8px;\n  font-size: 13px;\n  color: #475467;\n  background: #fff;\n  min-width: 160px;\n}\n/*# sourceMappingURL=department-filter.component.css.map */\n"] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DepartmentFilterComponent, { className: "DepartmentFilterComponent", filePath: "src/app/shared/components/department-filter/department-filter.component.ts", lineNumber: 26 });
})();

// src/app/features/analytics/components/view-mode-toggle/view-mode-toggle.component.ts
var ViewModeToggleComponent = class _ViewModeToggleComponent {
  mode = input("user");
  change = output();
  static \u0275fac = function ViewModeToggleComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ViewModeToggleComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ViewModeToggleComponent, selectors: [["app-view-mode-toggle"]], inputs: { mode: [1, "mode"] }, outputs: { change: "change" }, decls: 5, vars: 4, consts: [["role", "group", "aria-label", "View mode", 1, "toggle"], ["type", "button", 1, "toggle-btn", 3, "click"]], template: function ViewModeToggleComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "button", 1);
      \u0275\u0275listener("click", function ViewModeToggleComponent_Template_button_click_1_listener() {
        return ctx.change.emit("user");
      });
      \u0275\u0275text(2, " \u{1F464} User view ");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "button", 1);
      \u0275\u0275listener("click", function ViewModeToggleComponent_Template_button_click_3_listener() {
        return ctx.change.emit("report");
      });
      \u0275\u0275text(4, " \u{1F4CA} Report view ");
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275classProp("active", ctx.mode() === "user");
      \u0275\u0275advance(2);
      \u0275\u0275classProp("active", ctx.mode() === "report");
    }
  }, styles: ["\n\n.toggle[_ngcontent-%COMP%] {\n  display: inline-flex;\n  border: 1px solid #d0d5dd;\n  border-radius: 10px;\n  overflow: hidden;\n}\n.toggle-btn[_ngcontent-%COMP%] {\n  padding: 8px 18px;\n  background: #fff;\n  border: none;\n  cursor: pointer;\n  font-size: 14px;\n  color: #475467;\n}\n.toggle-btn[_ngcontent-%COMP%]    + .toggle-btn[_ngcontent-%COMP%] {\n  border-left: 1px solid #d0d5dd;\n}\n.toggle-btn.active[_ngcontent-%COMP%] {\n  background: #111827;\n  color: #fff;\n  font-weight: 600;\n}\n/*# sourceMappingURL=view-mode-toggle.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ViewModeToggleComponent, [{
    type: Component,
    args: [{ selector: "app-view-mode-toggle", standalone: true, template: `
    <div class="toggle" role="group" aria-label="View mode">
      <button type="button" class="toggle-btn" [class.active]="mode() === 'user'" (click)="change.emit('user')">
        \u{1F464} User view
      </button>
      <button type="button" class="toggle-btn" [class.active]="mode() === 'report'" (click)="change.emit('report')">
        \u{1F4CA} Report view
      </button>
    </div>
  `, styles: ["/* angular:styles/component:css;fc093355e444173bad469ab0db7e5ed87f91b28750cfd89c49f0f54caa144b23;/Users/pavithrameddaduwage/Downloads/Access Tool/user_access_tool/frontend/src/app/features/analytics/components/view-mode-toggle/view-mode-toggle.component.ts */\n.toggle {\n  display: inline-flex;\n  border: 1px solid #d0d5dd;\n  border-radius: 10px;\n  overflow: hidden;\n}\n.toggle-btn {\n  padding: 8px 18px;\n  background: #fff;\n  border: none;\n  cursor: pointer;\n  font-size: 14px;\n  color: #475467;\n}\n.toggle-btn + .toggle-btn {\n  border-left: 1px solid #d0d5dd;\n}\n.toggle-btn.active {\n  background: #111827;\n  color: #fff;\n  font-weight: 600;\n}\n/*# sourceMappingURL=view-mode-toggle.component.css.map */\n"] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ViewModeToggleComponent, { className: "ViewModeToggleComponent", filePath: "src/app/features/analytics/components/view-mode-toggle/view-mode-toggle.component.ts", lineNumber: 28 });
})();

// src/app/features/analytics/components/overview-cards/overview-cards.component.ts
function OverviewCardsComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2);
    \u0275\u0275text(3, "Active users");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 3);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 1)(7, "div", 2);
    \u0275\u0275text(8, "Engaged hours");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "div", 3);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "div", 1)(12, "div", 2);
    \u0275\u0275text(13, "Avg min / user");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "div", 3);
    \u0275\u0275text(15);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(16, "div", 1)(17, "div", 2);
    \u0275\u0275text(18, "Top dashboard");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "div", 4);
    \u0275\u0275text(20);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(21, "div", 5);
    \u0275\u0275text(22);
    \u0275\u0275pipe(23, "number");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(24, "div", 1)(25, "div", 2);
    \u0275\u0275text(26, "Most-viewed report");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(27, "div", 4);
    \u0275\u0275text(28);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(29, "div", 5);
    \u0275\u0275text(30);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    let tmp_5_0;
    let tmp_7_0;
    const o_r1 = ctx;
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(o_r1.activeUsers);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(o_r1.totalEngagedHours);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(o_r1.avgEngagedMinPerUser);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate((tmp_5_0 = o_r1.topDashboard == null ? null : o_r1.topDashboard.name) !== null && tmp_5_0 !== void 0 ? tmp_5_0 : "\u2014");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(o_r1.topDashboard ? \u0275\u0275pipeBind2(23, 7, o_r1.topDashboard.engagedSeconds / 3600, "1.1-1") + " h" : "");
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate((tmp_7_0 = o_r1.mostViewedReport == null ? null : o_r1.mostViewedReport.name) !== null && tmp_7_0 !== void 0 ? tmp_7_0 : "\u2014");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(o_r1.mostViewedReport ? o_r1.mostViewedReport.viewCount + " views" : "");
  }
}
var OverviewCardsComponent = class _OverviewCardsComponent {
  overview = input(null);
  static \u0275fac = function OverviewCardsComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _OverviewCardsComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _OverviewCardsComponent, selectors: [["app-overview-cards"]], inputs: { overview: [1, "overview"] }, decls: 1, vars: 1, consts: [[1, "cards"], [1, "card"], [1, "label"], [1, "value"], [1, "value", "sm"], [1, "sub"]], template: function OverviewCardsComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275template(0, OverviewCardsComponent_Conditional_0_Template, 31, 10, "div", 0);
    }
    if (rf & 2) {
      let tmp_0_0;
      \u0275\u0275conditional((tmp_0_0 = ctx.overview()) ? 0 : -1, tmp_0_0);
    }
  }, dependencies: [DecimalPipe], styles: ["\n\n.cards[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));\n  gap: 12px;\n}\n.card[_ngcontent-%COMP%] {\n  background: #fff;\n  border: 1px solid #eaecf0;\n  border-radius: 12px;\n  padding: 16px;\n}\n.label[_ngcontent-%COMP%] {\n  font-size: 12px;\n  color: #667085;\n  text-transform: uppercase;\n  letter-spacing: .03em;\n}\n.value[_ngcontent-%COMP%] {\n  font-size: 28px;\n  font-weight: 700;\n  color: #101828;\n  margin-top: 6px;\n}\n.value.sm[_ngcontent-%COMP%] {\n  font-size: 16px;\n  font-weight: 600;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.sub[_ngcontent-%COMP%] {\n  font-size: 12px;\n  color: #667085;\n  margin-top: 4px;\n}\n/*# sourceMappingURL=overview-cards.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(OverviewCardsComponent, [{
    type: Component,
    args: [{ selector: "app-overview-cards", standalone: true, imports: [DecimalPipe], template: `
    @if (overview(); as o) {
      <div class="cards">
        <div class="card"><div class="label">Active users</div><div class="value">{{ o.activeUsers }}</div></div>
        <div class="card"><div class="label">Engaged hours</div><div class="value">{{ o.totalEngagedHours }}</div></div>
        <div class="card"><div class="label">Avg min / user</div><div class="value">{{ o.avgEngagedMinPerUser }}</div></div>
        <div class="card">
          <div class="label">Top dashboard</div>
          <div class="value sm">{{ o.topDashboard?.name ?? '\u2014' }}</div>
          <div class="sub">{{ o.topDashboard ? (o.topDashboard.engagedSeconds / 3600 | number: '1.1-1') + ' h' : '' }}</div>
        </div>
        <div class="card">
          <div class="label">Most-viewed report</div>
          <div class="value sm">{{ o.mostViewedReport?.name ?? '\u2014' }}</div>
          <div class="sub">{{ o.mostViewedReport ? o.mostViewedReport.viewCount + ' views' : '' }}</div>
        </div>
      </div>
    }
  `, styles: ["/* angular:styles/component:css;dec40178b6aa75318776f24a6be45156e6b0f5d83ff3d8fe2c4fd3e1b7b1e122;/Users/pavithrameddaduwage/Downloads/Access Tool/user_access_tool/frontend/src/app/features/analytics/components/overview-cards/overview-cards.component.ts */\n.cards {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));\n  gap: 12px;\n}\n.card {\n  background: #fff;\n  border: 1px solid #eaecf0;\n  border-radius: 12px;\n  padding: 16px;\n}\n.label {\n  font-size: 12px;\n  color: #667085;\n  text-transform: uppercase;\n  letter-spacing: .03em;\n}\n.value {\n  font-size: 28px;\n  font-weight: 700;\n  color: #101828;\n  margin-top: 6px;\n}\n.value.sm {\n  font-size: 16px;\n  font-weight: 600;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.sub {\n  font-size: 12px;\n  color: #667085;\n  margin-top: 4px;\n}\n/*# sourceMappingURL=overview-cards.component.css.map */\n"] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(OverviewCardsComponent, { className: "OverviewCardsComponent", filePath: "src/app/features/analytics/components/overview-cards/overview-cards.component.ts", lineNumber: 40 });
})();

// src/app/features/analytics/components/user-table/user-table.component.ts
var _forTrack0 = ($index, $item) => $item.userId;
function UserTableComponent_For_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "tr", 3);
    \u0275\u0275listener("click", function UserTableComponent_For_17_Template_tr_click_0_listener() {
      const u_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.selectUser.emit(u_r2.userId));
    });
    \u0275\u0275elementStart(1, "td");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "td");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "td");
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "td");
    \u0275\u0275text(8);
    \u0275\u0275pipe(9, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "td");
    \u0275\u0275text(11);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "td");
    \u0275\u0275text(13);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_10_0;
    let tmp_11_0;
    const u_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate((tmp_10_0 = u_r2.userEmail) !== null && tmp_10_0 !== void 0 ? tmp_10_0 : u_r2.userId);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate((tmp_11_0 = u_r2.department) !== null && tmp_11_0 !== void 0 ? tmp_11_0 : "\u2014");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r2.fmt(u_r2.totalEngagedSeconds));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(u_r2.lastSeen ? \u0275\u0275pipeBind2(9, 6, u_r2.lastSeen, "short") : "\u2014");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(u_r2.sessionCount);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(u_r2.totalViews);
  }
}
function UserTableComponent_ForEmpty_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td", 4);
    \u0275\u0275text(2, "No users in this period.");
    \u0275\u0275elementEnd()();
  }
}
var UserTableComponent = class _UserTableComponent {
  users = input([]);
  selectUser = output();
  sortKey = signal("totalEngagedSeconds");
  sortDir = signal("desc");
  sorted = computed(() => {
    const key = this.sortKey();
    const dir = this.sortDir() === "asc" ? 1 : -1;
    return [...this.users()].sort((a, b) => {
      const av = this.sortValue(a, key);
      const bv = this.sortValue(b, key);
      return av < bv ? -1 * dir : av > bv ? 1 * dir : 0;
    });
  });
  sortBy(key) {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === "asc" ? "desc" : "asc");
    } else {
      this.sortKey.set(key);
      this.sortDir.set("desc");
    }
  }
  arrow(key) {
    if (this.sortKey() !== key)
      return "";
    return this.sortDir() === "asc" ? "\u25B2" : "\u25BC";
  }
  fmt(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
  sortValue(u, key) {
    if (key === "lastSeen")
      return u.lastSeen ? new Date(u.lastSeen).getTime() : 0;
    return u[key];
  }
  static \u0275fac = function UserTableComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _UserTableComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _UserTableComponent, selectors: [["app-user-table"]], inputs: { users: [1, "users"] }, outputs: { selectUser: "selectUser" }, decls: 19, vars: 4, consts: [[1, "tbl"], [1, "sortable", 3, "click"], [1, "row"], [1, "row", 3, "click"], ["colspan", "6", 1, "empty"]], template: function UserTableComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "table", 0)(1, "thead")(2, "tr")(3, "th");
      \u0275\u0275text(4, "User");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(5, "th");
      \u0275\u0275text(6, "Department");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(7, "th", 1);
      \u0275\u0275listener("click", function UserTableComponent_Template_th_click_7_listener() {
        return ctx.sortBy("totalEngagedSeconds");
      });
      \u0275\u0275text(8);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(9, "th", 1);
      \u0275\u0275listener("click", function UserTableComponent_Template_th_click_9_listener() {
        return ctx.sortBy("lastSeen");
      });
      \u0275\u0275text(10);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(11, "th");
      \u0275\u0275text(12, "Sessions");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(13, "th", 1);
      \u0275\u0275listener("click", function UserTableComponent_Template_th_click_13_listener() {
        return ctx.sortBy("totalViews");
      });
      \u0275\u0275text(14);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(15, "tbody");
      \u0275\u0275repeaterCreate(16, UserTableComponent_For_17_Template, 14, 9, "tr", 2, _forTrack0, false, UserTableComponent_ForEmpty_18_Template, 3, 0, "tr");
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(8);
      \u0275\u0275textInterpolate1("Engaged ", ctx.arrow("totalEngagedSeconds"), "");
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate1("Last seen ", ctx.arrow("lastSeen"), "");
      \u0275\u0275advance(4);
      \u0275\u0275textInterpolate1("Views ", ctx.arrow("totalViews"), "");
      \u0275\u0275advance(2);
      \u0275\u0275repeater(ctx.sorted());
    }
  }, dependencies: [DatePipe], styles: ["\n\n.tbl[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  background: #fff;\n  font-size: 13px;\n}\nth[_ngcontent-%COMP%], \ntd[_ngcontent-%COMP%] {\n  text-align: left;\n  padding: 10px 12px;\n  border-bottom: 1px solid #eaecf0;\n}\nth[_ngcontent-%COMP%] {\n  color: #667085;\n  font-weight: 600;\n  font-size: 12px;\n  text-transform: uppercase;\n}\n.sortable[_ngcontent-%COMP%] {\n  cursor: pointer;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.row[_ngcontent-%COMP%] {\n  cursor: pointer;\n}\n.row[_ngcontent-%COMP%]:hover {\n  background: #f9fafb;\n}\n.empty[_ngcontent-%COMP%] {\n  text-align: center;\n  color: #98a2b3;\n  padding: 24px;\n}\n/*# sourceMappingURL=user-table.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(UserTableComponent, [{
    type: Component,
    args: [{ selector: "app-user-table", standalone: true, imports: [DatePipe], template: `
    <table class="tbl">
      <thead>
        <tr>
          <th>User</th>
          <th>Department</th>
          <th class="sortable" (click)="sortBy('totalEngagedSeconds')">Engaged {{ arrow('totalEngagedSeconds') }}</th>
          <th class="sortable" (click)="sortBy('lastSeen')">Last seen {{ arrow('lastSeen') }}</th>
          <th>Sessions</th>
          <th class="sortable" (click)="sortBy('totalViews')">Views {{ arrow('totalViews') }}</th>
        </tr>
      </thead>
      <tbody>
        @for (u of sorted(); track u.userId) {
          <tr class="row" (click)="selectUser.emit(u.userId)">
            <td>{{ u.userEmail ?? u.userId }}</td>
            <td>{{ u.department ?? '\u2014' }}</td>
            <td>{{ fmt(u.totalEngagedSeconds) }}</td>
            <td>{{ u.lastSeen ? (u.lastSeen | date: 'short') : '\u2014' }}</td>
            <td>{{ u.sessionCount }}</td>
            <td>{{ u.totalViews }}</td>
          </tr>
        } @empty {
          <tr><td colspan="6" class="empty">No users in this period.</td></tr>
        }
      </tbody>
    </table>
  `, styles: ["/* angular:styles/component:css;053f1bf12914693bbd1b832a7273ea10fe3f8c9ac73eebc92319b44189e01806;/Users/pavithrameddaduwage/Downloads/Access Tool/user_access_tool/frontend/src/app/features/analytics/components/user-table/user-table.component.ts */\n.tbl {\n  width: 100%;\n  border-collapse: collapse;\n  background: #fff;\n  font-size: 13px;\n}\nth,\ntd {\n  text-align: left;\n  padding: 10px 12px;\n  border-bottom: 1px solid #eaecf0;\n}\nth {\n  color: #667085;\n  font-weight: 600;\n  font-size: 12px;\n  text-transform: uppercase;\n}\n.sortable {\n  cursor: pointer;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.row {\n  cursor: pointer;\n}\n.row:hover {\n  background: #f9fafb;\n}\n.empty {\n  text-align: center;\n  color: #98a2b3;\n  padding: 24px;\n}\n/*# sourceMappingURL=user-table.component.css.map */\n"] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(UserTableComponent, { className: "UserTableComponent", filePath: "src/app/features/analytics/components/user-table/user-table.component.ts", lineNumber: 52 });
})();

// src/app/features/analytics/components/component-table/component-table.component.ts
var _forTrack02 = ($index, $item) => $item.label;
var _forTrack1 = ($index, $item) => $item.componentId + $item.componentType;
function ComponentTableComponent_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 4);
    \u0275\u0275listener("click", function ComponentTableComponent_For_2_Template_button_click_0_listener() {
      const c_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.typeChange.emit(c_r2.value));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const c_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classProp("active", c_r2.value === ctx_r2.activeType());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", c_r2.label, " ");
  }
}
function ComponentTableComponent_For_18_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "tr", 5);
    \u0275\u0275listener("click", function ComponentTableComponent_For_18_Template_tr_click_0_listener() {
      const r_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.selectComponent.emit({ type: r_r5.componentType, id: r_r5.componentId }));
    });
    \u0275\u0275elementStart(1, "td");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "td")(4, "span", 6);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "td");
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "td");
    \u0275\u0275text(9);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "td");
    \u0275\u0275text(11);
    \u0275\u0275pipe(12, "date");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_10_0;
    const r_r5 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate((tmp_10_0 = r_r5.componentName) !== null && tmp_10_0 !== void 0 ? tmp_10_0 : r_r5.componentId);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(r_r5.componentType);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(r_r5.totalViews);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(r_r5.uniqueViewers);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(r_r5.lastViewedAt ? \u0275\u0275pipeBind2(12, 5, r_r5.lastViewedAt, "short") : "\u2014");
  }
}
function ComponentTableComponent_ForEmpty_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td", 7);
    \u0275\u0275text(2, "No components in this period.");
    \u0275\u0275elementEnd()();
  }
}
var ComponentTableComponent = class _ComponentTableComponent {
  rows = input([]);
  activeType = input(null);
  typeChange = output();
  selectComponent = output();
  chips = [
    { label: "All", value: null },
    { label: "Reports", value: "report" },
    { label: "Dashboards", value: "dashboard" },
    { label: "Pages", value: "dashboard_page" },
    { label: "Datasets", value: "dataset" }
  ];
  static \u0275fac = function ComponentTableComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ComponentTableComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ComponentTableComponent, selectors: [["app-component-table"]], inputs: { rows: [1, "rows"], activeType: [1, "activeType"] }, outputs: { typeChange: "typeChange", selectComponent: "selectComponent" }, decls: 20, vars: 1, consts: [[1, "chips"], ["type", "button", 1, "chip", 3, "active"], [1, "tbl"], [1, "row"], ["type", "button", 1, "chip", 3, "click"], [1, "row", 3, "click"], [1, "badge"], ["colspan", "5", 1, "empty"]], template: function ComponentTableComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0);
      \u0275\u0275repeaterCreate(1, ComponentTableComponent_For_2_Template, 2, 3, "button", 1, _forTrack02);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "table", 2)(4, "thead")(5, "tr")(6, "th");
      \u0275\u0275text(7, "Name");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(8, "th");
      \u0275\u0275text(9, "Type");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(10, "th");
      \u0275\u0275text(11, "Total views");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(12, "th");
      \u0275\u0275text(13, "Unique viewers");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(14, "th");
      \u0275\u0275text(15, "Last viewed");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(16, "tbody");
      \u0275\u0275repeaterCreate(17, ComponentTableComponent_For_18_Template, 13, 8, "tr", 3, _forTrack1, false, ComponentTableComponent_ForEmpty_19_Template, 3, 0, "tr");
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.chips);
      \u0275\u0275advance(16);
      \u0275\u0275repeater(ctx.rows());
    }
  }, dependencies: [DatePipe], styles: ["\n\n.chips[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 8px;\n  margin-bottom: 12px;\n  flex-wrap: wrap;\n}\n.chip[_ngcontent-%COMP%] {\n  padding: 5px 12px;\n  border: 1px solid #d0d5dd;\n  border-radius: 16px;\n  background: #fff;\n  cursor: pointer;\n  font-size: 12px;\n  color: #475467;\n}\n.chip.active[_ngcontent-%COMP%] {\n  background: #2563eb;\n  color: #fff;\n  border-color: #2563eb;\n}\n.tbl[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  background: #fff;\n  font-size: 13px;\n}\nth[_ngcontent-%COMP%], \ntd[_ngcontent-%COMP%] {\n  text-align: left;\n  padding: 10px 12px;\n  border-bottom: 1px solid #eaecf0;\n}\nth[_ngcontent-%COMP%] {\n  color: #667085;\n  font-weight: 600;\n  font-size: 12px;\n  text-transform: uppercase;\n}\n.row[_ngcontent-%COMP%] {\n  cursor: pointer;\n}\n.row[_ngcontent-%COMP%]:hover {\n  background: #f9fafb;\n}\n.badge[_ngcontent-%COMP%] {\n  background: #eff8ff;\n  color: #175cd3;\n  padding: 2px 8px;\n  border-radius: 12px;\n  font-size: 11px;\n}\n.empty[_ngcontent-%COMP%] {\n  text-align: center;\n  color: #98a2b3;\n  padding: 24px;\n}\n/*# sourceMappingURL=component-table.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ComponentTableComponent, [{
    type: Component,
    args: [{ selector: "app-component-table", standalone: true, imports: [DatePipe], template: `
    <div class="chips">
      @for (c of chips; track c.label) {
        <button type="button" class="chip" [class.active]="c.value === activeType()" (click)="typeChange.emit(c.value)">
          {{ c.label }}
        </button>
      }
    </div>
    <table class="tbl">
      <thead>
        <tr><th>Name</th><th>Type</th><th>Total views</th><th>Unique viewers</th><th>Last viewed</th></tr>
      </thead>
      <tbody>
        @for (r of rows(); track r.componentId + r.componentType) {
          <tr class="row" (click)="selectComponent.emit({ type: r.componentType, id: r.componentId })">
            <td>{{ r.componentName ?? r.componentId }}</td>
            <td><span class="badge">{{ r.componentType }}</span></td>
            <td>{{ r.totalViews }}</td>
            <td>{{ r.uniqueViewers }}</td>
            <td>{{ r.lastViewedAt ? (r.lastViewedAt | date: 'short') : '\u2014' }}</td>
          </tr>
        } @empty {
          <tr><td colspan="5" class="empty">No components in this period.</td></tr>
        }
      </tbody>
    </table>
  `, styles: ["/* angular:styles/component:css;e6ac362816bfbede684aea182e94c525030dbda92c7366f9ad685555ce24b203;/Users/pavithrameddaduwage/Downloads/Access Tool/user_access_tool/frontend/src/app/features/analytics/components/component-table/component-table.component.ts */\n.chips {\n  display: flex;\n  gap: 8px;\n  margin-bottom: 12px;\n  flex-wrap: wrap;\n}\n.chip {\n  padding: 5px 12px;\n  border: 1px solid #d0d5dd;\n  border-radius: 16px;\n  background: #fff;\n  cursor: pointer;\n  font-size: 12px;\n  color: #475467;\n}\n.chip.active {\n  background: #2563eb;\n  color: #fff;\n  border-color: #2563eb;\n}\n.tbl {\n  width: 100%;\n  border-collapse: collapse;\n  background: #fff;\n  font-size: 13px;\n}\nth,\ntd {\n  text-align: left;\n  padding: 10px 12px;\n  border-bottom: 1px solid #eaecf0;\n}\nth {\n  color: #667085;\n  font-weight: 600;\n  font-size: 12px;\n  text-transform: uppercase;\n}\n.row {\n  cursor: pointer;\n}\n.row:hover {\n  background: #f9fafb;\n}\n.badge {\n  background: #eff8ff;\n  color: #175cd3;\n  padding: 2px 8px;\n  border-radius: 12px;\n  font-size: 11px;\n}\n.empty {\n  text-align: center;\n  color: #98a2b3;\n  padding: 24px;\n}\n/*# sourceMappingURL=component-table.component.css.map */\n"] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ComponentTableComponent, { className: "ComponentTableComponent", filePath: "src/app/features/analytics/components/component-table/component-table.component.ts", lineNumber: 57 });
})();

// src/app/features/analytics/components/user-view-counts/user-view-counts.component.ts
var _forTrack03 = ($index, $item) => $item.componentId + $item.componentType;
function UserViewCountsComponent_For_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "td")(4, "span", 1);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "td");
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "td");
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "date");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_10_0;
    const v_r1 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate((tmp_10_0 = v_r1.componentName) !== null && tmp_10_0 !== void 0 ? tmp_10_0 : v_r1.componentId);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(v_r1.componentType);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(v_r1.viewCount);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(v_r1.lastViewedAt ? \u0275\u0275pipeBind2(10, 4, v_r1.lastViewedAt, "short") : "\u2014");
  }
}
function UserViewCountsComponent_ForEmpty_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td", 2);
    \u0275\u0275text(2, "No views recorded.");
    \u0275\u0275elementEnd()();
  }
}
var UserViewCountsComponent = class _UserViewCountsComponent {
  views = input([]);
  static \u0275fac = function UserViewCountsComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _UserViewCountsComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _UserViewCountsComponent, selectors: [["app-user-view-counts"]], inputs: { views: [1, "views"] }, decls: 15, vars: 1, consts: [[1, "tbl"], [1, "badge"], ["colspan", "4", 1, "empty"]], template: function UserViewCountsComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "table", 0)(1, "thead")(2, "tr")(3, "th");
      \u0275\u0275text(4, "Component");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(5, "th");
      \u0275\u0275text(6, "Type");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(7, "th");
      \u0275\u0275text(8, "Views");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(9, "th");
      \u0275\u0275text(10, "Last viewed");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(11, "tbody");
      \u0275\u0275repeaterCreate(12, UserViewCountsComponent_For_13_Template, 11, 7, "tr", null, _forTrack03, false, UserViewCountsComponent_ForEmpty_14_Template, 3, 0, "tr");
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(12);
      \u0275\u0275repeater(ctx.views());
    }
  }, dependencies: [DatePipe], styles: ["\n\n.tbl[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 13px;\n}\nth[_ngcontent-%COMP%], \ntd[_ngcontent-%COMP%] {\n  text-align: left;\n  padding: 8px 10px;\n  border-bottom: 1px solid #eaecf0;\n}\nth[_ngcontent-%COMP%] {\n  color: #667085;\n  font-size: 11px;\n  text-transform: uppercase;\n}\n.badge[_ngcontent-%COMP%] {\n  background: #eff8ff;\n  color: #175cd3;\n  padding: 2px 8px;\n  border-radius: 12px;\n  font-size: 11px;\n}\n.empty[_ngcontent-%COMP%] {\n  text-align: center;\n  color: #98a2b3;\n  padding: 16px;\n}\n/*# sourceMappingURL=user-view-counts.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(UserViewCountsComponent, [{
    type: Component,
    args: [{ selector: "app-user-view-counts", standalone: true, imports: [DatePipe], template: `
    <table class="tbl">
      <thead><tr><th>Component</th><th>Type</th><th>Views</th><th>Last viewed</th></tr></thead>
      <tbody>
        @for (v of views(); track v.componentId + v.componentType) {
          <tr>
            <td>{{ v.componentName ?? v.componentId }}</td>
            <td><span class="badge">{{ v.componentType }}</span></td>
            <td>{{ v.viewCount }}</td>
            <td>{{ v.lastViewedAt ? (v.lastViewedAt | date: 'short') : '\u2014' }}</td>
          </tr>
        } @empty {
          <tr><td colspan="4" class="empty">No views recorded.</td></tr>
        }
      </tbody>
    </table>
  `, styles: ["/* angular:styles/component:css;309a0c8292623ab233d075c0d891ece121f7c4d80d830ae7c9416d98142d2723;/Users/pavithrameddaduwage/Downloads/Access Tool/user_access_tool/frontend/src/app/features/analytics/components/user-view-counts/user-view-counts.component.ts */\n.tbl {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 13px;\n}\nth,\ntd {\n  text-align: left;\n  padding: 8px 10px;\n  border-bottom: 1px solid #eaecf0;\n}\nth {\n  color: #667085;\n  font-size: 11px;\n  text-transform: uppercase;\n}\n.badge {\n  background: #eff8ff;\n  color: #175cd3;\n  padding: 2px 8px;\n  border-radius: 12px;\n  font-size: 11px;\n}\n.empty {\n  text-align: center;\n  color: #98a2b3;\n  padding: 16px;\n}\n/*# sourceMappingURL=user-view-counts.component.css.map */\n"] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(UserViewCountsComponent, { className: "UserViewCountsComponent", filePath: "src/app/features/analytics/components/user-view-counts/user-view-counts.component.ts", lineNumber: 37 });
})();

// src/app/features/analytics/components/user-drill-down/user-drill-down.component.ts
var _forTrack04 = ($index, $item) => $item.id;
function UserDrillDownComponent_Conditional_2_For_36_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "td");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "td");
    \u0275\u0275text(6);
    \u0275\u0275pipe(7, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "td");
    \u0275\u0275text(9);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "td");
    \u0275\u0275text(11);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "td");
    \u0275\u0275text(13);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "td");
    \u0275\u0275text(15);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_13_0;
    const s_r1 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(s_r1.dashboardId);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate((tmp_13_0 = s_r1.tabName) !== null && tmp_13_0 !== void 0 ? tmp_13_0 : "\u2014");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind2(7, 7, s_r1.startedAt, "short"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(ctx_r1.fmt(s_r1.engagedSeconds));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(s_r1.clickCount);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(s_r1.scrollCount);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(s_r1.copyCount);
  }
}
function UserDrillDownComponent_Conditional_2_ForEmpty_37_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td", 5);
    \u0275\u0275text(2, "No sessions.");
    \u0275\u0275elementEnd()();
  }
}
function UserDrillDownComponent_Conditional_2_For_54_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "td");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "td");
    \u0275\u0275text(6);
    \u0275\u0275pipe(7, "date");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_13_0;
    const a_r3 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(a_r3.activityType);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate((tmp_13_0 = a_r3.reportName) !== null && tmp_13_0 !== void 0 ? tmp_13_0 : "\u2014");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind2(7, 3, a_r3.activityAt, "short"));
  }
}
function UserDrillDownComponent_Conditional_2_ForEmpty_55_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td", 6);
    \u0275\u0275text(2, "No audit events.");
    \u0275\u0275elementEnd()();
  }
}
function UserDrillDownComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h2");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "div", 2)(3, "span")(4, "b");
    \u0275\u0275text(5, "Department:");
    \u0275\u0275elementEnd();
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "span")(8, "b");
    \u0275\u0275text(9, "Engaged:");
    \u0275\u0275elementEnd();
    \u0275\u0275text(10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "span")(12, "b");
    \u0275\u0275text(13, "Total views:");
    \u0275\u0275elementEnd();
    \u0275\u0275text(14);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(15, "h3");
    \u0275\u0275text(16, "Sessions");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "table", 3)(18, "thead")(19, "tr")(20, "th");
    \u0275\u0275text(21, "Dashboard");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "th");
    \u0275\u0275text(23, "Tab");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(24, "th");
    \u0275\u0275text(25, "Started");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(26, "th");
    \u0275\u0275text(27, "Engaged");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(28, "th");
    \u0275\u0275text(29, "Clicks");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(30, "th");
    \u0275\u0275text(31, "Scrolls");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(32, "th");
    \u0275\u0275text(33, "Copies");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(34, "tbody");
    \u0275\u0275repeaterCreate(35, UserDrillDownComponent_Conditional_2_For_36_Template, 16, 10, "tr", null, _forTrack04, false, UserDrillDownComponent_Conditional_2_ForEmpty_37_Template, 3, 0, "tr");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(38, "h3");
    \u0275\u0275text(39, "Components viewed");
    \u0275\u0275elementEnd();
    \u0275\u0275element(40, "app-user-view-counts", 4);
    \u0275\u0275elementStart(41, "h3");
    \u0275\u0275text(42, "Audit events");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(43, "table", 3)(44, "thead")(45, "tr")(46, "th");
    \u0275\u0275text(47, "Activity");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(48, "th");
    \u0275\u0275text(49, "Report");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(50, "th");
    \u0275\u0275text(51, "When");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(52, "tbody");
    \u0275\u0275repeaterCreate(53, UserDrillDownComponent_Conditional_2_For_54_Template, 8, 6, "tr", null, \u0275\u0275repeaterTrackByIndex, false, UserDrillDownComponent_Conditional_2_ForEmpty_55_Template, 3, 0, "tr");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_2_0;
    let tmp_3_0;
    const d_r4 = ctx;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate((tmp_2_0 = d_r4.user.userEmail) !== null && tmp_2_0 !== void 0 ? tmp_2_0 : d_r4.user.userId);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", (tmp_3_0 = d_r4.user.department) !== null && tmp_3_0 !== void 0 ? tmp_3_0 : "\u2014", "");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", ctx_r1.fmt(d_r4.user.totalEngagedSeconds), "");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", d_r4.user.totalViews, "");
    \u0275\u0275advance(21);
    \u0275\u0275repeater(d_r4.sessions);
    \u0275\u0275advance(5);
    \u0275\u0275property("views", d_r4.views);
    \u0275\u0275advance(13);
    \u0275\u0275repeater(d_r4.audit);
  }
}
function UserDrillDownComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 1);
    \u0275\u0275text(1, "Loading\u2026");
    \u0275\u0275elementEnd();
  }
}
var UserDrillDownComponent = class _UserDrillDownComponent {
  api = inject(AnalyticsApiService);
  userId = input.required();
  query = input({});
  back = output();
  detail = signal(null);
  constructor() {
    effect(() => {
      const id = this.userId();
      const q = this.query();
      this.detail.set(null);
      this.api.getUserDetail(id, q).subscribe({
        next: (d) => this.detail.set(d),
        error: () => this.detail.set(null)
      });
    });
  }
  fmt(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
  static \u0275fac = function UserDrillDownComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _UserDrillDownComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _UserDrillDownComponent, selectors: [["app-user-drill-down"]], inputs: { userId: [1, "userId"], query: [1, "query"] }, outputs: { back: "back" }, decls: 4, vars: 1, consts: [["type", "button", 1, "back", 3, "click"], [1, "loading"], [1, "summary"], [1, "tbl"], [3, "views"], ["colspan", "7", 1, "empty"], ["colspan", "3", 1, "empty"]], template: function UserDrillDownComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "button", 0);
      \u0275\u0275listener("click", function UserDrillDownComponent_Template_button_click_0_listener() {
        return ctx.back.emit();
      });
      \u0275\u0275text(1, "\u2190 Back to users");
      \u0275\u0275elementEnd();
      \u0275\u0275template(2, UserDrillDownComponent_Conditional_2_Template, 56, 7)(3, UserDrillDownComponent_Conditional_3_Template, 2, 0, "p", 1);
    }
    if (rf & 2) {
      let tmp_0_0;
      \u0275\u0275advance(2);
      \u0275\u0275conditional((tmp_0_0 = ctx.detail()) ? 2 : 3, tmp_0_0);
    }
  }, dependencies: [DatePipe, UserViewCountsComponent], styles: ["\n\n.back[_ngcontent-%COMP%] {\n  background: none;\n  border: none;\n  color: #2563eb;\n  cursor: pointer;\n  font-size: 13px;\n  padding: 0;\n  margin-bottom: 12px;\n}\nh2[_ngcontent-%COMP%] {\n  margin: 0 0 8px;\n}\nh3[_ngcontent-%COMP%] {\n  margin: 20px 0 8px;\n  font-size: 14px;\n  color: #344054;\n}\n.summary[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 20px;\n  font-size: 13px;\n  color: #475467;\n  margin-bottom: 8px;\n}\n.tbl[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  background: #fff;\n  font-size: 13px;\n}\nth[_ngcontent-%COMP%], \ntd[_ngcontent-%COMP%] {\n  text-align: left;\n  padding: 8px 10px;\n  border-bottom: 1px solid #eaecf0;\n}\nth[_ngcontent-%COMP%] {\n  color: #667085;\n  font-size: 11px;\n  text-transform: uppercase;\n}\n.empty[_ngcontent-%COMP%] {\n  text-align: center;\n  color: #98a2b3;\n  padding: 16px;\n}\n.loading[_ngcontent-%COMP%] {\n  color: #98a2b3;\n}\n/*# sourceMappingURL=user-drill-down.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(UserDrillDownComponent, [{
    type: Component,
    args: [{ selector: "app-user-drill-down", standalone: true, imports: [DatePipe, UserViewCountsComponent], template: `
    <button type="button" class="back" (click)="back.emit()">\u2190 Back to users</button>
    @if (detail(); as d) {
      <h2>{{ d.user.userEmail ?? d.user.userId }}</h2>
      <div class="summary">
        <span><b>Department:</b> {{ d.user.department ?? '\u2014' }}</span>
        <span><b>Engaged:</b> {{ fmt(d.user.totalEngagedSeconds) }}</span>
        <span><b>Total views:</b> {{ d.user.totalViews }}</span>
      </div>

      <h3>Sessions</h3>
      <table class="tbl">
        <thead><tr><th>Dashboard</th><th>Tab</th><th>Started</th><th>Engaged</th><th>Clicks</th><th>Scrolls</th><th>Copies</th></tr></thead>
        <tbody>
          @for (s of d.sessions; track s.id) {
            <tr>
              <td>{{ s.dashboardId }}</td>
              <td>{{ s.tabName ?? '\u2014' }}</td>
              <td>{{ s.startedAt | date: 'short' }}</td>
              <td>{{ fmt(s.engagedSeconds) }}</td>
              <td>{{ s.clickCount }}</td>
              <td>{{ s.scrollCount }}</td>
              <td>{{ s.copyCount }}</td>
            </tr>
          } @empty { <tr><td colspan="7" class="empty">No sessions.</td></tr> }
        </tbody>
      </table>

      <h3>Components viewed</h3>
      <app-user-view-counts [views]="d.views" />

      <h3>Audit events</h3>
      <table class="tbl">
        <thead><tr><th>Activity</th><th>Report</th><th>When</th></tr></thead>
        <tbody>
          @for (a of d.audit; track $index) {
            <tr><td>{{ a.activityType }}</td><td>{{ a.reportName ?? '\u2014' }}</td><td>{{ a.activityAt | date: 'short' }}</td></tr>
          } @empty { <tr><td colspan="3" class="empty">No audit events.</td></tr> }
        </tbody>
      </table>
    } @else {
      <p class="loading">Loading\u2026</p>
    }
  `, styles: ["/* angular:styles/component:css;484c91694593a9d004ab7d9ae5fc5d65a0b692b4d572a6f44c3a850c2345ba32;/Users/pavithrameddaduwage/Downloads/Access Tool/user_access_tool/frontend/src/app/features/analytics/components/user-drill-down/user-drill-down.component.ts */\n.back {\n  background: none;\n  border: none;\n  color: #2563eb;\n  cursor: pointer;\n  font-size: 13px;\n  padding: 0;\n  margin-bottom: 12px;\n}\nh2 {\n  margin: 0 0 8px;\n}\nh3 {\n  margin: 20px 0 8px;\n  font-size: 14px;\n  color: #344054;\n}\n.summary {\n  display: flex;\n  gap: 20px;\n  font-size: 13px;\n  color: #475467;\n  margin-bottom: 8px;\n}\n.tbl {\n  width: 100%;\n  border-collapse: collapse;\n  background: #fff;\n  font-size: 13px;\n}\nth,\ntd {\n  text-align: left;\n  padding: 8px 10px;\n  border-bottom: 1px solid #eaecf0;\n}\nth {\n  color: #667085;\n  font-size: 11px;\n  text-transform: uppercase;\n}\n.empty {\n  text-align: center;\n  color: #98a2b3;\n  padding: 16px;\n}\n.loading {\n  color: #98a2b3;\n}\n/*# sourceMappingURL=user-drill-down.component.css.map */\n"] }]
  }], () => [], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(UserDrillDownComponent, { className: "UserDrillDownComponent", filePath: "src/app/features/analytics/components/user-drill-down/user-drill-down.component.ts", lineNumber: 70 });
})();

// src/app/features/analytics/components/component-viewer-list/component-viewer-list.component.ts
var _forTrack05 = ($index, $item) => $item.userId;
function ComponentViewerListComponent_For_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "td");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "td");
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "td");
    \u0275\u0275text(8);
    \u0275\u0275pipe(9, "date");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_10_0;
    const v_r1 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate((tmp_10_0 = v_r1.userEmail) !== null && tmp_10_0 !== void 0 ? tmp_10_0 : v_r1.userId);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(v_r1.viewCount);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.fmt(v_r1.totalEngagedSeconds));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(v_r1.lastViewedAt ? \u0275\u0275pipeBind2(9, 4, v_r1.lastViewedAt, "short") : "\u2014");
  }
}
function ComponentViewerListComponent_ForEmpty_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td", 1);
    \u0275\u0275text(2, "No viewers recorded.");
    \u0275\u0275elementEnd()();
  }
}
var ComponentViewerListComponent = class _ComponentViewerListComponent {
  viewers = input([]);
  fmt(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
  static \u0275fac = function ComponentViewerListComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ComponentViewerListComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ComponentViewerListComponent, selectors: [["app-component-viewer-list"]], inputs: { viewers: [1, "viewers"] }, decls: 15, vars: 1, consts: [[1, "tbl"], ["colspan", "4", 1, "empty"]], template: function ComponentViewerListComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "table", 0)(1, "thead")(2, "tr")(3, "th");
      \u0275\u0275text(4, "User");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(5, "th");
      \u0275\u0275text(6, "Views");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(7, "th");
      \u0275\u0275text(8, "Engaged");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(9, "th");
      \u0275\u0275text(10, "Last viewed");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(11, "tbody");
      \u0275\u0275repeaterCreate(12, ComponentViewerListComponent_For_13_Template, 10, 7, "tr", null, _forTrack05, false, ComponentViewerListComponent_ForEmpty_14_Template, 3, 0, "tr");
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(12);
      \u0275\u0275repeater(ctx.viewers());
    }
  }, dependencies: [DatePipe], styles: ["\n\n.tbl[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 13px;\n}\nth[_ngcontent-%COMP%], \ntd[_ngcontent-%COMP%] {\n  text-align: left;\n  padding: 8px 10px;\n  border-bottom: 1px solid #eaecf0;\n}\nth[_ngcontent-%COMP%] {\n  color: #667085;\n  font-size: 11px;\n  text-transform: uppercase;\n}\n.empty[_ngcontent-%COMP%] {\n  text-align: center;\n  color: #98a2b3;\n  padding: 16px;\n}\n/*# sourceMappingURL=component-viewer-list.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ComponentViewerListComponent, [{
    type: Component,
    args: [{ selector: "app-component-viewer-list", standalone: true, imports: [DatePipe], template: `
    <table class="tbl">
      <thead><tr><th>User</th><th>Views</th><th>Engaged</th><th>Last viewed</th></tr></thead>
      <tbody>
        @for (v of viewers(); track v.userId) {
          <tr>
            <td>{{ v.userEmail ?? v.userId }}</td>
            <td>{{ v.viewCount }}</td>
            <td>{{ fmt(v.totalEngagedSeconds) }}</td>
            <td>{{ v.lastViewedAt ? (v.lastViewedAt | date: 'short') : '\u2014' }}</td>
          </tr>
        } @empty {
          <tr><td colspan="4" class="empty">No viewers recorded.</td></tr>
        }
      </tbody>
    </table>
  `, styles: ["/* angular:styles/component:css;e7a0323f3c14a3e5a1692b9a389c4e0d7ff52cc75cea84d942e6f9400f5c6a24;/Users/pavithrameddaduwage/Downloads/Access Tool/user_access_tool/frontend/src/app/features/analytics/components/component-viewer-list/component-viewer-list.component.ts */\n.tbl {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 13px;\n}\nth,\ntd {\n  text-align: left;\n  padding: 8px 10px;\n  border-bottom: 1px solid #eaecf0;\n}\nth {\n  color: #667085;\n  font-size: 11px;\n  text-transform: uppercase;\n}\n.empty {\n  text-align: center;\n  color: #98a2b3;\n  padding: 16px;\n}\n/*# sourceMappingURL=component-viewer-list.component.css.map */\n"] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ComponentViewerListComponent, { className: "ComponentViewerListComponent", filePath: "src/app/features/analytics/components/component-viewer-list/component-viewer-list.component.ts", lineNumber: 36 });
})();

// src/app/features/analytics/components/component-drill-down/component-drill-down.component.ts
var ComponentDrillDownComponent = class _ComponentDrillDownComponent {
  api = inject(AnalyticsApiService);
  type = input.required();
  id = input.required();
  back = output();
  viewers = signal([]);
  constructor() {
    effect(() => {
      const t = this.type();
      const cid = this.id();
      this.viewers.set([]);
      this.api.getViewsByComponent(t, cid).subscribe({
        next: (rows) => this.viewers.set(rows),
        error: () => this.viewers.set([])
      });
    });
  }
  static \u0275fac = function ComponentDrillDownComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ComponentDrillDownComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ComponentDrillDownComponent, selectors: [["app-component-drill-down"]], inputs: { type: [1, "type"], id: [1, "id"] }, outputs: { back: "back" }, decls: 9, vars: 4, consts: [["type", "button", 1, "back", 3, "click"], [1, "meta"], [3, "viewers"]], template: function ComponentDrillDownComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "button", 0);
      \u0275\u0275listener("click", function ComponentDrillDownComponent_Template_button_click_0_listener() {
        return ctx.back.emit();
      });
      \u0275\u0275text(1, "\u2190 Back to components");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(2, "h2");
      \u0275\u0275text(3);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(4, "div", 1);
      \u0275\u0275text(5);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "h3");
      \u0275\u0275text(7, "Viewers");
      \u0275\u0275elementEnd();
      \u0275\u0275element(8, "app-component-viewer-list", 2);
    }
    if (rf & 2) {
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate2("", ctx.type(), " \xB7 ", ctx.id(), "");
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate1("", ctx.viewers().length, " viewer(s)");
      \u0275\u0275advance(3);
      \u0275\u0275property("viewers", ctx.viewers());
    }
  }, dependencies: [ComponentViewerListComponent], styles: ["\n\n.back[_ngcontent-%COMP%] {\n  background: none;\n  border: none;\n  color: #2563eb;\n  cursor: pointer;\n  font-size: 13px;\n  padding: 0;\n  margin-bottom: 12px;\n}\nh2[_ngcontent-%COMP%] {\n  margin: 0 0 4px;\n  font-size: 18px;\n}\nh3[_ngcontent-%COMP%] {\n  margin: 20px 0 8px;\n  font-size: 14px;\n  color: #344054;\n}\n.meta[_ngcontent-%COMP%] {\n  font-size: 13px;\n  color: #667085;\n}\n/*# sourceMappingURL=component-drill-down.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ComponentDrillDownComponent, [{
    type: Component,
    args: [{ selector: "app-component-drill-down", standalone: true, imports: [ComponentViewerListComponent], template: `
    <button type="button" class="back" (click)="back.emit()">\u2190 Back to components</button>
    <h2>{{ type() }} \xB7 {{ id() }}</h2>
    <div class="meta">{{ viewers().length }} viewer(s)</div>
    <h3>Viewers</h3>
    <app-component-viewer-list [viewers]="viewers()" />
  `, styles: ["/* angular:styles/component:css;48285a034546a7812d5604f71f8a7b7f717d52a64da674a896f1e6b732fd76fd;/Users/pavithrameddaduwage/Downloads/Access Tool/user_access_tool/frontend/src/app/features/analytics/components/component-drill-down/component-drill-down.component.ts */\n.back {\n  background: none;\n  border: none;\n  color: #2563eb;\n  cursor: pointer;\n  font-size: 13px;\n  padding: 0;\n  margin-bottom: 12px;\n}\nh2 {\n  margin: 0 0 4px;\n  font-size: 18px;\n}\nh3 {\n  margin: 20px 0 8px;\n  font-size: 14px;\n  color: #344054;\n}\n.meta {\n  font-size: 13px;\n  color: #667085;\n}\n/*# sourceMappingURL=component-drill-down.component.css.map */\n"] }]
  }], () => [], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ComponentDrillDownComponent, { className: "ComponentDrillDownComponent", filePath: "src/app/features/analytics/components/component-drill-down/component-drill-down.component.ts", lineNumber: 27 });
})();

// src/app/features/analytics/analytics-dashboard.component.ts
function AnalyticsDashboardComponent_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-user-drill-down", 12);
    \u0275\u0275listener("back", function AnalyticsDashboardComponent_Conditional_12_Template_app_user_drill_down_back_0_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.selectedUserId.set(null));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    const uid_r4 = \u0275\u0275readContextLet(10);
    \u0275\u0275property("userId", uid_r4)("query", ctx_r2.query());
  }
}
function AnalyticsDashboardComponent_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-component-drill-down", 13);
    \u0275\u0275listener("back", function AnalyticsDashboardComponent_Conditional_13_Template_app_component_drill_down_back_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.selectedComponent.set(null));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275nextContext();
    const comp_r6 = \u0275\u0275readContextLet(11);
    \u0275\u0275property("type", comp_r6.type)("id", comp_r6.id);
  }
}
function AnalyticsDashboardComponent_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-user-table", 14);
    \u0275\u0275listener("selectUser", function AnalyticsDashboardComponent_Conditional_14_Template_app_user_table_selectUser_0_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.selectedUserId.set($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("users", ctx_r2.users());
  }
}
function AnalyticsDashboardComponent_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-component-table", 15);
    \u0275\u0275listener("typeChange", function AnalyticsDashboardComponent_Conditional_15_Template_app_component_table_typeChange_0_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onTypeChange($event));
    })("selectComponent", function AnalyticsDashboardComponent_Conditional_15_Template_app_component_table_selectComponent_0_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.selectedComponent.set($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("rows", ctx_r2.components())("activeType", ctx_r2.activeType());
  }
}
var AnalyticsDashboardComponent = class _AnalyticsDashboardComponent {
  api = inject(AnalyticsApiService);
  period = signal("30d");
  department = signal(null);
  viewMode = signal("user");
  activeType = signal(null);
  selectedUserId = signal(null);
  selectedComponent = signal(null);
  overview = signal(null);
  users = signal([]);
  components = signal([]);
  dashboards = signal([]);
  /** Distinct departments derived from the loaded users. */
  departments = computed(() => Array.from(new Set(this.users().map((u) => u.department).filter((d) => !!d))).sort());
  query = computed(() => ({
    period: this.period(),
    department: this.department() ?? void 0
  }));
  constructor() {
    effect(() => {
      const q = this.query();
      this.api.getOverview(q).subscribe({ next: (o) => this.overview.set(o), error: () => this.overview.set(null) });
      if (this.viewMode() === "user") {
        this.api.getUsers(q).subscribe({ next: (r) => this.users.set(r), error: () => this.users.set([]) });
      } else {
        const type = this.activeType() ?? void 0;
        this.api.getTopViews(q, type, 50).subscribe({
          next: (r) => this.components.set(r),
          error: () => this.components.set([])
        });
      }
    });
  }
  onViewMode(mode) {
    this.selectedUserId.set(null);
    this.selectedComponent.set(null);
    this.viewMode.set(mode);
  }
  onPeriod(p) {
    this.period.set(p);
  }
  onDepartment(d) {
    this.department.set(d);
  }
  onTypeChange(type) {
    this.activeType.set(type);
  }
  static \u0275fac = function AnalyticsDashboardComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AnalyticsDashboardComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AnalyticsDashboardComponent, selectors: [["app-analytics-dashboard"]], decls: 16, vars: 8, consts: [[1, "page"], [1, "bar"], [1, "controls"], [3, "change", "mode"], [3, "select", "value"], [3, "select", "departments", "value"], [3, "overview"], [1, "content"], [3, "userId", "query"], [3, "type", "id"], [3, "users"], [3, "rows", "activeType"], [3, "back", "userId", "query"], [3, "back", "type", "id"], [3, "selectUser", "users"], [3, "typeChange", "selectComponent", "rows", "activeType"]], template: function AnalyticsDashboardComponent_Template(rf, ctx) {
    if (rf & 1) {
      const _r1 = \u0275\u0275getCurrentView();
      \u0275\u0275elementStart(0, "div", 0)(1, "header", 1)(2, "h1");
      \u0275\u0275text(3, "Engagement Analytics");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(4, "div", 2)(5, "app-view-mode-toggle", 3);
      \u0275\u0275listener("change", function AnalyticsDashboardComponent_Template_app_view_mode_toggle_change_5_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onViewMode($event));
      });
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "app-period-filter", 4);
      \u0275\u0275listener("select", function AnalyticsDashboardComponent_Template_app_period_filter_select_6_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onPeriod($event));
      });
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(7, "app-department-filter", 5);
      \u0275\u0275listener("select", function AnalyticsDashboardComponent_Template_app_department_filter_select_7_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onDepartment($event));
      });
      \u0275\u0275elementEnd()()();
      \u0275\u0275element(8, "app-overview-cards", 6);
      \u0275\u0275elementStart(9, "section", 7);
      \u0275\u0275declareLet(10)(11);
      \u0275\u0275template(12, AnalyticsDashboardComponent_Conditional_12_Template, 1, 2, "app-user-drill-down", 8)(13, AnalyticsDashboardComponent_Conditional_13_Template, 1, 2, "app-component-drill-down", 9)(14, AnalyticsDashboardComponent_Conditional_14_Template, 1, 1, "app-user-table", 10)(15, AnalyticsDashboardComponent_Conditional_15_Template, 1, 2, "app-component-table", 11);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(5);
      \u0275\u0275property("mode", ctx.viewMode());
      \u0275\u0275advance();
      \u0275\u0275property("value", ctx.period());
      \u0275\u0275advance();
      \u0275\u0275property("departments", ctx.departments())("value", ctx.department());
      \u0275\u0275advance();
      \u0275\u0275property("overview", ctx.overview());
      \u0275\u0275advance(2);
      const uid_r9 = \u0275\u0275storeLet(ctx.selectedUserId());
      \u0275\u0275advance();
      const comp_r10 = \u0275\u0275storeLet(ctx.selectedComponent());
      \u0275\u0275advance();
      \u0275\u0275conditional(uid_r9 ? 12 : comp_r10 ? 13 : ctx.viewMode() === "user" ? 14 : 15);
    }
  }, dependencies: [
    PeriodFilterComponent,
    DepartmentFilterComponent,
    ViewModeToggleComponent,
    OverviewCardsComponent,
    UserTableComponent,
    ComponentTableComponent,
    UserDrillDownComponent,
    ComponentDrillDownComponent
  ], styles: ["\n\n.page[_ngcontent-%COMP%] {\n  padding: 24px;\n  max-width: 1200px;\n  margin: 0 auto;\n}\n.bar[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 12px;\n  margin-bottom: 20px;\n}\nh1[_ngcontent-%COMP%] {\n  font-size: 22px;\n  margin: 0;\n  color: #101828;\n}\n.controls[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n  flex-wrap: wrap;\n}\n.content[_ngcontent-%COMP%] {\n  margin-top: 20px;\n  background: transparent;\n}\n/*# sourceMappingURL=analytics-dashboard.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AnalyticsDashboardComponent, [{
    type: Component,
    args: [{ selector: "app-analytics-dashboard", standalone: true, imports: [
      PeriodFilterComponent,
      DepartmentFilterComponent,
      ViewModeToggleComponent,
      OverviewCardsComponent,
      UserTableComponent,
      ComponentTableComponent,
      UserDrillDownComponent,
      ComponentDrillDownComponent
    ], template: `
    <div class="page">
      <header class="bar">
        <h1>Engagement Analytics</h1>
        <div class="controls">
          <app-view-mode-toggle [mode]="viewMode()" (change)="onViewMode($event)" />
          <app-period-filter [value]="period()" (select)="onPeriod($event)" />
          <app-department-filter [departments]="departments()" [value]="department()" (select)="onDepartment($event)" />
        </div>
      </header>

      <app-overview-cards [overview]="overview()" />

      <section class="content">
        @let uid = selectedUserId();
        @let comp = selectedComponent();
        @if (uid) {
          <app-user-drill-down [userId]="uid" [query]="query()" (back)="selectedUserId.set(null)" />
        } @else if (comp) {
          <app-component-drill-down [type]="comp.type" [id]="comp.id" (back)="selectedComponent.set(null)" />
        } @else if (viewMode() === 'user') {
          <app-user-table [users]="users()" (selectUser)="selectedUserId.set($event)" />
        } @else {
          <app-component-table
            [rows]="components()"
            [activeType]="activeType()"
            (typeChange)="onTypeChange($event)"
            (selectComponent)="selectedComponent.set($event)"
          />
        }
      </section>
    </div>
  `, styles: ["/* angular:styles/component:css;dc609d96c1a47acf0a3b46ae2f3209ce130cf5e11766724759569bb75fd8db8b;/Users/pavithrameddaduwage/Downloads/Access Tool/user_access_tool/frontend/src/app/features/analytics/analytics-dashboard.component.ts */\n.page {\n  padding: 24px;\n  max-width: 1200px;\n  margin: 0 auto;\n}\n.bar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 12px;\n  margin-bottom: 20px;\n}\nh1 {\n  font-size: 22px;\n  margin: 0;\n  color: #101828;\n}\n.controls {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n  flex-wrap: wrap;\n}\n.content {\n  margin-top: 20px;\n  background: transparent;\n}\n/*# sourceMappingURL=analytics-dashboard.component.css.map */\n"] }]
  }], () => [], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AnalyticsDashboardComponent, { className: "AnalyticsDashboardComponent", filePath: "src/app/features/analytics/analytics-dashboard.component.ts", lineNumber: 81 });
})();

// src/app/features/analytics/analytics.routes.ts
var ANALYTICS_ROUTES = [
  { path: "", component: AnalyticsDashboardComponent }
];
export {
  ANALYTICS_ROUTES
};
//# sourceMappingURL=chunk-XI6YQVX6.js.map
