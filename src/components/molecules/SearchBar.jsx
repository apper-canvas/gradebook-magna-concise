import { useState } from "react";
import Input from "@/components/atoms/Input";
import ApperIcon from "@/components/ApperIcon";

const SearchBar = ({ placeholder = "Search...", onSearch, className }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <ApperIcon
        name="Search"
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4"
      />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleChange}
        className="pl-10 bg-white/80 backdrop-blur-sm border-slate-200 focus:bg-white"
      />
    </div>
  );
};

export default SearchBar;