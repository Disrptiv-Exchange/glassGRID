import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GlassGridComponent, type ColumnDef, type ColumnGroupDef } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-column-groups',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Column groups</h1>
      <p>Nested column groups produce a multi-level header. Each group can be collapsed (showing only its first child) via the ⏷ / ⏵ button.</p>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="column-groups-grid"
        [columnDefs]="cols"
        [rowData]="rows"
      />
    </section>
  `,
})
export class ColumnGroupsFeature {
  readonly rows = makeRows(80);
  readonly cols: (ColumnDef<Employee> | ColumnGroupDef<Employee>)[] = [
    { field: 'id', headerName: '#', width: 70 },
    {
      headerName: 'Person',
      groupId: 'person',
      children: [
        { field: 'name', width: 180 },
        { field: 'email', width: 240 },
      ],
    } as ColumnGroupDef<Employee>,
    {
      headerName: 'Role',
      groupId: 'role',
      openByDefault: true,
      children: [
        { field: 'department', width: 140 },
        { field: 'title', width: 200 },
        { field: 'level', headerName: 'Lvl', width: 80 },
      ],
    } as ColumnGroupDef<Employee>,
    {
      headerName: 'Compensation',
      groupId: 'comp',
      children: [
        { field: 'salary', width: 130, valueFormatter: p => typeof p.value === 'number' ? `$${(p.value as number).toLocaleString()}` : '' },
        { field: 'rating', width: 100 },
      ],
    } as ColumnGroupDef<Employee>,
    { field: 'location', width: 160 },
  ];
}
