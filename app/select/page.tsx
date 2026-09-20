import SelectExperience from "./SelectExperience";

export default function SelectPage({ searchParams }: { searchParams: { zip?: string } }) {
  return <SelectExperience initialZip={searchParams.zip ?? ""} />;
}
