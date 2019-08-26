/** MusicCast Monitoring functions by yannbug yann@abc.fr **/

clog( 'wp-geojson-map js script loaded.' );

var device_ip;
var api_base_url = '/YamahaExtendedControl/v1/';

function clog(data){
	if(true){
		console.log(data);
	}
}
	
/**
 * jQuery functions
 *
 */
(function($) {
	$(document).ready(function() {
		clog( 'MusicCast jQ functions loaded!' );
		
		if( !device_ip ) {
			$('#get_ip').show();
		}
		
		$('#ok_button').on('click', function(e){
			clog( 'clicked Ok!' );
			device_ip = $('#device_ip').val();
			clog( 'device_ip: ' + device_ip );
			get_status();
		});
		
		/** Get the status of the device **/
		get_status = function() {
			clog( 'Getting status...' );
			var url = 'http://' + device_ip + api_base_url + 'netusb/getPlayInfo';
			$.get( url, function( data ) {
				clog('Success!');
				clog(data);
				
				var play_time = pad( Math.floor( data.play_time / 60 ), 2 ) + ':' +
					pad( ( data.play_time % 60 ), 2 );
				var total_time = pad( Math.floor( data.total_time / 60 ), 2 ) + ':' +
					pad( ( data.total_time % 60 ), 2 );
				
				var html = '<ul>' +
					'<li><strong>Input:</strong> <em>' + data.input + '</em></li>' +
					'<li><strong>Play queue type:</strong> <em>' + data.play_queue_type + '</em></li>' +
					'<li><strong>Playback status:</strong> <em>' + data.playback + '</em></li>' +
					'<li><strong>Repeat:</strong> <em>' + data.repeat + '</em></li>' +
					'<li><strong>Shuffle:</strong> <em>' + data.shuffle + '</em></li>' +
					'<li><strong>Play time:</strong> <em>' + play_time + ' / ' + total_time + '</em></li>' +
					//'<li><strong>Total time:</strong> <em>' + data.total_time + '</em></li>' +
					'<li><strong>Artist:</strong> <em>' + data.artist + '</em></li>' +
					'<li><strong>Album:</strong> <em>' + data.album + '</em></li>' +
					'<li><strong>Track:</strong> <em>' + data.track + '</em></li>' +
					'</ul>' +
					'<img src="http://' + device_ip + data.albumart_url + '" />';
				$('#content').html( html );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
			setTimeout( get_status, 10000 );
		}
		
		/** Add leading zeroes **/
		pad = function(str, max) {
			str = str.toString();
			return str.length < max ? pad("0" + str, max) : str;
		}
	});
})( jQuery );