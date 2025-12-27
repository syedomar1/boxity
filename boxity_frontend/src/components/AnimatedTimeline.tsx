import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Calendar, ExternalLink } from 'lucide-react';
import { type BatchEvent } from '@/lib/demoData';

interface AnimatedTimelineProps {
  events: BatchEvent[];
}

export const AnimatedTimeline = ({ events }: AnimatedTimelineProps) => {
  const getIntegrityColor = (note: string) => {
    if (note.toLowerCase().includes('dent') || note.toLowerCase().includes('damage')) {
      return 'bg-yellow-500';
    }
    if (note.toLowerCase().includes('verified') || note.toLowerCase().includes('intact')) {
      return 'bg-green-500';
    }
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-6">
      {events.map((event, index) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.15, duration: 0.5, ease: 'easeOut' }}
          className="relative pl-8 pb-6 border-l-2 border-primary/30 last:border-l-0 last:pb-0"
        >
          {/* Timeline dot with integrity color */}
          <motion.div
            className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-4 border-background ${getIntegrityColor(event.note)}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.15 + 0.2, type: 'spring', stiffness: 500, damping: 15 }}
          />

          <div className="space-y-3 bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold text-lg">{event.actor}</h4>
                <Badge variant="secondary" className="mt-1">
                  {event.role}
                </Badge>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(event.timestamp).toLocaleString()}
                </div>
              </div>
            </div>

            <p className="text-muted-foreground">{event.note}</p>

            {event.image && (
              <motion.img
                src={event.image}
                alt="Event documentation"
                className="w-48 h-48 object-cover rounded-lg border border-border"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.15 + 0.3 }}
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            )}

            <div className="space-y-2 p-3 bg-muted/50 rounded-lg text-sm font-mono">
              <div>
                <span className="text-muted-foreground">Hash: </span>
                <span className="text-xs break-all">{event.hash}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Ledger: </span>
                <span className="text-xs break-all flex-1">{event.ledgerRef}</span>
                <ExternalLink className="h-3 w-3 text-primary cursor-pointer hover:text-primary/80" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
