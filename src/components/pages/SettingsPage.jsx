import { motion } from "framer-motion";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/atoms/Card";
import ApperIcon from "@/components/ApperIcon";

const SettingsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-slate-600 font-medium mt-2">
          Configure your gradebook preferences and application settings
        </p>
      </div>

      <Card className="text-center py-16">
        <CardContent>
          <div className="bg-gradient-to-br from-warning-100 to-warning-200 p-8 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
            <ApperIcon name="Settings" className="h-16 w-16 text-warning-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Application Settings</h2>
          <p className="text-slate-600 font-medium max-w-md mx-auto">
            Customize your gradebook experience with personalized settings, grading scales, and notification preferences.
          </p>
          <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border-2 border-dashed border-slate-300">
            <p className="text-sm font-semibold text-slate-700 mb-2">Configuration Options:</p>
            <ul className="text-left text-sm text-slate-600 space-y-2 max-w-sm mx-auto">
              <li className="flex items-center gap-2">
                <ApperIcon name="Scale" className="h-4 w-4 text-warning-500" />
                Grading scale customization
              </li>
              <li className="flex items-center gap-2">
                <ApperIcon name="Bell" className="h-4 w-4 text-warning-500" />
                Notification preferences
              </li>
              <li className="flex items-center gap-2">
                <ApperIcon name="Palette" className="h-4 w-4 text-warning-500" />
                Theme and display options
              </li>
              <li className="flex items-center gap-2">
                <ApperIcon name="Download" className="h-4 w-4 text-warning-500" />
                Data export settings
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SettingsPage;