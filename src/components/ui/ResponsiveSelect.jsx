import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ResponsiveSelect({ value, onChange, options = [], placeholder = "Select…", disabled = false, triggerClassName = "" }) {
  const isMobile = useIsMobile();
  const normalized = options.map(option => typeof option === "string" ? { value: option, label: option } : option);

  if (isMobile) {
    return <BottomSheetSelect value={value} onChange={onChange} options={normalized} placeholder={placeholder} disabled={disabled} triggerClassName={triggerClassName} />;
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={triggerClassName}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{normalized.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
    </Select>
  );
}