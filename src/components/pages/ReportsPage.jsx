import { motion } from "framer-motion";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/atoms/Card";
import ApperIcon from "@/components/ApperIcon";

const ReportsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold gradient-text">Reports</h1>
        <p className="text-slate-600 font-medium mt-2">
          Generate insights and analytics on student performance
        </p>
      </div>

      <Card className="text-center py-16">
        <CardContent>
          <div className="bg-gradient-to-br from-accent-100 to-primary-100 p-8 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
            <ApperIcon name="BarChart3" className="h-16 w-16 text-accent-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Analytics & Reports</h2>
          <p className="text-slate-600 font-medium max-w-md mx-auto">
            Comprehensive reporting tools to track student progress, identify trends, and generate parent communication materials.
          </p>
          <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border-2 border-dashed border-slate-300">
            <p className="text-sm font-semibold text-slate-700 mb-2">Upcoming Features:</p>
            <ul className="text-left text-sm text-slate-600 space-y-2 max-w-sm mx-auto">
              <li className="flex items-center gap-2">
                <ApperIcon name="TrendingUp" className="h-4 w-4 text-primary-500" />
                Grade trend analysis
              </li>
              <li className="flex items-center gap-2">
                <ApperIcon name="PieChart" className="h-4 w-4 text-primary-500" />
                Class performance overview
              </li>
              <li className="flex items-center gap-2">
                <ApperIcon name="FileText" className="h-4 w-4 text-primary-500" />
                Progress report generator
              </li>
              <li className="flex items-center gap-2">
                <ApperIcon name="Mail" className="h-4 w-4 text-primary-500" />
                Parent communication tools
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReportsPage;