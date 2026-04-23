import { NextResponse } from "next/server";
import { getStore } from "@/lib/v2/store";
import { DimensionOption, BranchDimensionOption } from "@/lib/v2/types";

export const dynamic = "force-dynamic";

export async function GET() {
    const store = await getStore();

    const partners: DimensionOption[] = store.partners
        .map((p) => ({ id: p.id, label: p.short_title ?? p.title }))
        .sort((a, b) => a.label.localeCompare(b.label, "ru"));

    const cities: DimensionOption[] = store.cities
        .map((c) => ({ id: c.id, label: c.title }))
        .sort((a, b) => a.label.localeCompare(b.label, "ru"));

    const companies: DimensionOption[] = store.companies
        .map((c) => ({
            id: c.id,
            label: c.title,
            extra: c.city_id != null ? (store.citiesById.get(c.city_id)?.title ?? undefined) : undefined,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "ru"));

    const tariffs: DimensionOption[] = store.tariffs
        .map((t) => ({ id: t.id, label: t.title }))
        .sort((a, b) => a.label.localeCompare(b.label, "ru"));

    const branches: BranchDimensionOption[] = store.branches
        .map((b) => {
            const company = b.company_id != null ? store.companiesById.get(b.company_id) : undefined;
            const city = b.city_id != null ? store.citiesById.get(b.city_id) : undefined;
            const label = b.short_title ?? b.title ?? `Филиал ${b.id}`;
            const extraParts: string[] = [];
            if (company) extraParts.push(company.title);
            if (city) extraParts.push(city.title);
            return {
                id: b.id,
                label,
                extra: extraParts.length ? extraParts.join(" · ") : undefined,
                companyId: b.company_id,
                cityId: b.city_id,
            };
        })
        .sort((a, b) => a.label.localeCompare(b.label, "ru"));

    const professionIds = new Set<number>();
    for (const v of store.vacancies) if (v.profession_id != null) professionIds.add(v.profession_id);
    const professions: DimensionOption[] = Array.from(professionIds)
        .sort((a, b) => a - b)
        .map((id) => ({ id, label: `Профессия ${id}` }));

    const shiftDates = store.shifts.map((s) => s.date).filter((d) => d);
    const minDate = shiftDates.length ? shiftDates.reduce((a, b) => (a < b ? a : b)) : null;
    const maxDate = shiftDates.length ? shiftDates.reduce((a, b) => (a > b ? a : b)) : null;

    return NextResponse.json({
        partners,
        cities,
        companies,
        branches,
        tariffs,
        professions,
        hasBranches: store.branches.length > 0,
        minDate,
        maxDate,
        counts: {
            partners: store.partners.length,
            cities: store.cities.length,
            companies: store.companies.length,
            tariffs: store.tariffs.length,
            vacancies: store.vacancies.length,
            shifts: store.shifts.length,
            shiftUsers: store.shiftUsers.length,
            balanceLog: store.balanceLog.length,
            branches: store.branches.length,
        },
    });
}
