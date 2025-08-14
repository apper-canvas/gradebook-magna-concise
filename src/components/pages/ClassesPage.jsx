import { motion } from "framer-motion";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/atoms/Card";
import ApperIcon from "@/components/ApperIcon";

const ClassesPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold gradient-text">Classes</h1>
        <p className="text-slate-600 font-medium mt-2">
          Manage your class periods and subjects
        </p>
      </div>

      <Card className="text-center py-16">
        <CardContent>
          <div className="bg-gradient-to-br from-primary-100 to-accent-100 p-8 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
            <ApperIcon name="BookOpen" className="h-16 w-16 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Classes Management</h2>
          <p className="text-slate-600 font-medium max-w-md mx-auto">
            This section will help you organize and manage different class periods, subjects, and curriculum planning.
          </p>
          <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border-2 border-dashed border-slate-300">
            <p className="text-sm font-semibold text-slate-700 mb-2">Coming Soon:</p>
            <ul className="text-left text-sm text-slate-600 space-y-2 max-w-sm mx-auto">
              <li className="flex items-center gap-2">
                <ApperIcon name="Check" className="h-4 w-4 text-success-500" />
                Subject and period management
              </li>
              <li className="flex items-center gap-2">
                <ApperIcon name="Check" className="h-4 w-4 text-success-500" />
                Curriculum planning tools
              </li>
              <li className="flex items-center gap-2">
                <ApperIcon name="Check" className="h-4 w-4 text-success-500" />
                Class schedule organization
              </li>
              <li className="flex items-center gap-2">
                <ApperIcon name="Check" className="h-4 w-4 text-success-500" />
                Assignment template library
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ClassesPage;