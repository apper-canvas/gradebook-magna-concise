import Label from "@/components/atoms/Label";
import Input from "@/components/atoms/Input";

const FormField = ({ label, error, children, required, className }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className={error ? "text-error-600" : ""}>
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </Label>
      )}
      {children}
      {error && (
        <p className="text-sm text-error-600 font-medium">{error}</p>
      )}
    </div>
  );
};

export default FormField;