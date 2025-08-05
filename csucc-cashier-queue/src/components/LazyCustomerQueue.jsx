import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Users, Star } from 'lucide-react';

const LazyCustomerQueue = ({ queue, handleTogglePriority }) => {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Waiting Queue ({queue.length} customers)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {queue.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No customers in queue</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {queue.map((customer, index) => (
              <div key={customer.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold">{customer.queue_number}</span>
                  {customer.isPriority && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      <Star className="h-3 w-3 mr-1" />
                      Priority
                    </Badge>
                  )}
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    {index === 0 ? "Next" : `Position ${index + 1}`}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-600">
                    Wait: {Math.floor((Date.now() - new Date(customer.joinedAt).getTime()) / 60000)} min
                  </span>
                  <Badge
                    size="sm"
                    variant="outline"
                    className="mr-1 bg-gray-200 hover:bg-gray-300 cursor-pointer"
                    onClick={() => handleTogglePriority(customer.id)}
                  >
                    {customer.isPriority ? "Unmark Priority" : "Mark Priority"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(LazyCustomerQueue);


