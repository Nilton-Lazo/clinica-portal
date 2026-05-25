import { LIST_PAGE_SIZES } from "../datagrid/buildListQuery";
import type { SelectOption } from "../ui/SelectMenu";

export const listPageSizeOptions: SelectOption[] = LIST_PAGE_SIZES.map((size) => ({
  value: String(size),
  label: String(size),
}));
